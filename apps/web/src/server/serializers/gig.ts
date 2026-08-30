import type { Gig, GigAttachment, ServiceCategory, User } from '@magobo/db';
import type { PublicGig, GigOwnerSummary } from '@magobo/shared';
import { toPublicCategory } from './profile';

type GigWithRelations = Gig & {
  category: ServiceCategory;
  owner: User & { kycCase?: { status: string } | null };
  attachments: GigAttachment[];
};

export function toGigOwnerSummary(owner: GigWithRelations['owner']): GigOwnerSummary {
  return {
    userId: owner.id,
    fullName: owner.fullName,
    kycVerified: owner.kycCase?.status === 'VERIFIED',
  };
}

export function toPublicGig(gig: GigWithRelations, options?: { includeOwnerEmail?: boolean }): PublicGig {
  void options;
  return {
    id: gig.id,
    title: gig.title,
    description: gig.description,
    status: gig.status,
    category: toPublicCategory(gig.category),
    budget: {
      minMinor: gig.budgetMinMinor,
      maxMinor: gig.budgetMaxMinor,
      currency: gig.currency,
    },
    location: {
      city: gig.locationCity,
      region: gig.locationRegion,
      country: gig.locationCountry,
      lat: gig.locationLat,
      lng: gig.locationLng,
    },
    deadlineAt: gig.deadlineAt?.toISOString() ?? null,
    publishedAt: gig.publishedAt?.toISOString() ?? null,
    createdAt: gig.createdAt.toISOString(),
    updatedAt: gig.updatedAt.toISOString(),
    owner: toGigOwnerSummary(gig.owner),
    attachments: gig.attachments.map((attachment) => ({
      id: attachment.id,
      originalFileName: attachment.originalFileName,
      mimeType: attachment.mimeType,
      fileSizeBytes: attachment.fileSizeBytes,
      uploadedAt: attachment.uploadedAt.toISOString(),
      downloadUrl: `/api/gigs/${gig.id}/attachments/${attachment.id}`,
    })),
  };
}
