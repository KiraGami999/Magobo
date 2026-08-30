import 'server-only';
import { prisma, type BusinessProfile, type User, type UserProfile, type UserRole } from '@magobo/db';
import type { EnableProviderRoleInput, UpdateBusinessProfileInput, UpdateUserProfileInput } from '@magobo/shared';
import { ConflictError, NotFoundError, ValidationError } from '@/server/errors';
import { storageProvider } from '@/server/providers/storage';
import {
  buildCategoryTree,
  toPublicBusinessProfile,
  toPublicUserProfile,
} from '@/server/serializers/profile';
import type { OwnProfile, PublicProfileView } from '@magobo/shared';

const profileInclude = {
  categories: { include: { category: true } },
} as const;

async function getOrCreateUserProfile(userId: string): Promise<UserProfile> {
  const existing = await prisma.userProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.userProfile.create({ data: { userId } });
}

async function getOrCreateBusinessProfile(userId: string, businessName: string): Promise<BusinessProfile> {
  const existing = await prisma.businessProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.businessProfile.create({ data: { userId, businessName } });
}

async function getOrCreateKycCase(userId: string) {
  const existing = await prisma.kycCase.findUnique({
    where: { userId },
    include: { documents: true },
  });
  if (existing) return existing;
  return prisma.kycCase.create({
    data: { userId },
    include: { documents: true },
  });
}

export async function getOwnProfile(user: User): Promise<OwnProfile> {
  const [userProfile, businessProfile, kycCase] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: user.id }, include: profileInclude }),
    prisma.businessProfile.findUnique({ where: { userId: user.id }, include: profileInclude }),
    getOrCreateKycCase(user.id),
  ]);

  return {
    userProfile: userProfile ? toPublicUserProfile(userProfile, user.id) : null,
    businessProfile: businessProfile ? toPublicBusinessProfile(businessProfile, user.id) : null,
    kycStatus: kycCase.status,
  };
}

export async function getPublicProfile(userId: string): Promise<PublicProfileView> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, status: { not: 'DEACTIVATED' } },
  });

  if (!user) throw new NotFoundError('Profile');

  const [userProfile, businessProfile, kycCase] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId }, include: profileInclude }),
    prisma.businessProfile.findUnique({ where: { userId }, include: profileInclude }),
    prisma.kycCase.findUnique({ where: { userId } }),
  ]);

  return {
    userId: user.id,
    fullName: user.fullName,
    roles: user.roles,
    userProfile: userProfile ? toPublicUserProfile(userProfile, user.id) : null,
    businessProfile: businessProfile ? toPublicBusinessProfile(businessProfile, user.id) : null,
    kycVerified: kycCase?.status === 'VERIFIED',
  };
}

export async function enableProviderRole(user: User, input: EnableProviderRoleInput): Promise<User> {
  const role = input.role as UserRole;
  if (user.roles.includes(role)) {
    throw new ConflictError('You already have this capability enabled.');
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { roles: { push: role } },
  });

  await getOrCreateUserProfile(user.id);

  if (role === 'BUSINESS') {
    await getOrCreateBusinessProfile(user.id, user.fullName);
  }

  await getOrCreateKycCase(user.id);

  return updated;
}

export async function updateUserProfile(userId: string, input: UpdateUserProfileInput) {
  await getOrCreateUserProfile(userId);

  if (input.categoryIds?.length) {
    const count = await prisma.serviceCategory.count({
      where: { id: { in: input.categoryIds } },
    });
    if (count !== input.categoryIds.length) {
      throw new ValidationError('One or more selected categories are invalid.');
    }
  }

  const profile = await prisma.$transaction(async (tx) => {
    const updated = await tx.userProfile.update({
      where: { userId },
      data: {
        bio: input.bio,
        yearsOfExperience: input.yearsOfExperience,
        availability: input.availability,
        skills: input.skills,
        locationCity: input.location?.city,
        locationRegion: input.location?.region,
        locationCountry: input.location?.country,
        locationLat: input.location?.lat,
        locationLng: input.location?.lng,
      },
    });

    if (input.categoryIds) {
      await tx.userProfileCategory.deleteMany({ where: { userProfileId: updated.id } });
      if (input.categoryIds.length > 0) {
        await tx.userProfileCategory.createMany({
          data: input.categoryIds.map((categoryId) => ({
            userProfileId: updated.id,
            categoryId,
          })),
        });
      }
    }

    return tx.userProfile.findUniqueOrThrow({
      where: { id: updated.id },
      include: profileInclude,
    });
  });

  return toPublicUserProfile(profile, userId);
}

export async function updateBusinessProfile(userId: string, input: UpdateBusinessProfileInput) {
  const shell = await prisma.businessProfile.findUnique({ where: { userId } });
  if (!shell) {
    throw new ValidationError('Enable a business profile before editing business details.');
  }

  if (input.categoryIds?.length) {
    const count = await prisma.serviceCategory.count({
      where: { id: { in: input.categoryIds } },
    });
    if (count !== input.categoryIds.length) {
      throw new ValidationError('One or more selected categories are invalid.');
    }
  }

  const profile = await prisma.$transaction(async (tx) => {
    const updated = await tx.businessProfile.update({
      where: { userId },
      data: {
        businessName: input.businessName,
        description: input.description,
        websiteUrl: input.websiteUrl === '' ? null : input.websiteUrl,
        locationCity: input.location?.city,
        locationRegion: input.location?.region,
        locationCountry: input.location?.country,
      },
    });

    if (input.categoryIds) {
      await tx.businessProfileCategory.deleteMany({ where: { businessProfileId: updated.id } });
      if (input.categoryIds.length > 0) {
        await tx.businessProfileCategory.createMany({
          data: input.categoryIds.map((categoryId) => ({
            businessProfileId: updated.id,
            categoryId,
          })),
        });
      }
    }

    return tx.businessProfile.findUniqueOrThrow({
      where: { id: updated.id },
      include: profileInclude,
    });
  });

  return toPublicBusinessProfile(profile, userId);
}

export async function uploadUserProfilePhoto(userId: string, file: {
  fileName: string;
  mimeType: string;
  data: Buffer;
}) {
  const profile = await getOrCreateUserProfile(userId);

  const stored = await storageProvider.store({
    namespace: `profiles/${userId}`,
    originalFileName: file.fileName,
    mimeType: file.mimeType,
    data: file.data,
  });

  if (profile.photoStorageKey) {
    await storageProvider.delete(profile.photoStorageKey).catch(() => undefined);
  }

  const updated = await prisma.userProfile.update({
    where: { id: profile.id },
    data: { photoStorageKey: stored.storageKey },
    include: profileInclude,
  });

  return toPublicUserProfile(updated, userId);
}

export async function getProfilePhotoStorageKey(
  userId: string,
  type: 'user' | 'business' = 'user',
): Promise<{ storageKey: string; mimeType: string } | null> {
  if (type === 'business') {
    const profile = await prisma.businessProfile.findUnique({ where: { userId } });
    if (!profile?.logoStorageKey) return null;
    return { storageKey: profile.logoStorageKey, mimeType: 'image/jpeg' };
  }

  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile?.photoStorageKey) return null;
  return { storageKey: profile.photoStorageKey, mimeType: 'image/jpeg' };
}

export async function listCategories() {
  const categories = await prisma.serviceCategory.findMany({ orderBy: { name: 'asc' } });
  return buildCategoryTree(categories);
}
