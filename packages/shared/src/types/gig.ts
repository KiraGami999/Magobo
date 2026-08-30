import type { PublicCategory } from './profile';

export interface GigLocation {
  city: string | null;
  region: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
}

export interface GigBudget {
  minMinor: number | null;
  maxMinor: number | null;
  currency: string;
}

export interface GigAttachmentSummary {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedAt: string;
  downloadUrl: string;
}

export interface GigOwnerSummary {
  userId: string;
  fullName: string;
  kycVerified: boolean;
}

/** Public gig card / detail — safe fields only. */
export interface PublicGig {
  id: string;
  title: string;
  description: string;
  status: string;
  category: PublicCategory;
  budget: GigBudget;
  location: GigLocation;
  deadlineAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner: GigOwnerSummary;
  attachments: GigAttachmentSummary[];
}

/** Owner view includes draft gigs with full edit context. */
export type OwnGig = PublicGig;

export interface DiscoverGigsQuery {
  q?: string;
  categoryId?: string;
  city?: string;
  country?: string;
  budgetMinMinor?: number;
  budgetMaxMinor?: number;
  page?: number;
  pageSize?: number;
}
