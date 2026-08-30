import type {
  BusinessProfile,
  ServiceCategory,
  UserProfile,
  UserProfileCategory,
  BusinessProfileCategory,
} from '@magobo/db';
import type { PublicBusinessProfile, PublicCategory, PublicUserProfile } from '@magobo/shared';

type UserProfileWithCategories = UserProfile & {
  categories: (UserProfileCategory & { category: ServiceCategory })[];
};

type BusinessProfileWithCategories = BusinessProfile & {
  categories: (BusinessProfileCategory & { category: ServiceCategory })[];
};

export function toPublicCategory(category: ServiceCategory): PublicCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    parentId: category.parentId,
  };
}

export function buildPhotoUrl(userId: string, hasPhoto: boolean): string | null {
  if (!hasPhoto) return null;
  return `/api/profile/photo/${userId}`;
}

export function toPublicUserProfile(
  profile: UserProfileWithCategories,
  userId: string,
): PublicUserProfile {
  return {
    id: profile.id,
    userId: profile.userId,
    bio: profile.bio,
    photoUrl: buildPhotoUrl(userId, Boolean(profile.photoStorageKey)),
    location: {
      city: profile.locationCity,
      region: profile.locationRegion,
      country: profile.locationCountry,
      lat: profile.locationLat,
      lng: profile.locationLng,
    },
    yearsOfExperience: profile.yearsOfExperience,
    availability: profile.availability,
    skills: profile.skills,
    averageRating: profile.averageRating,
    reviewCount: profile.reviewCount,
    completedGigsCount: profile.completedGigsCount,
    categories: profile.categories.map((entry) => toPublicCategory(entry.category)),
  };
}

export function toPublicBusinessProfile(
  profile: BusinessProfileWithCategories,
  userId: string,
): PublicBusinessProfile {
  return {
    id: profile.id,
    userId: profile.userId,
    businessName: profile.businessName,
    description: profile.description,
    logoUrl: profile.logoStorageKey ? `/api/profile/photo/${userId}?type=business` : null,
    websiteUrl: profile.websiteUrl,
    location: {
      city: profile.locationCity,
      region: profile.locationRegion,
      country: profile.locationCountry,
    },
    averageRating: profile.averageRating,
    reviewCount: profile.reviewCount,
    completedGigsCount: profile.completedGigsCount,
    categories: profile.categories.map((entry) => toPublicCategory(entry.category)),
  };
}

export function buildCategoryTree(categories: ServiceCategory[]): PublicCategory[] {
  const byParent = new Map<string | null, ServiceCategory[]>();

  for (const category of categories) {
    const key = category.parentId ?? null;
    const list = byParent.get(key) ?? [];
    list.push(category);
    byParent.set(key, list);
  }

  function build(parentId: string | null): PublicCategory[] {
    return (byParent.get(parentId) ?? []).map((category) => ({
      ...toPublicCategory(category),
      children: build(category.id),
    }));
  }

  return build(null);
}
