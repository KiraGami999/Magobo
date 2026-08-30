/** Public-facing service category for profile/gig selection. */
export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  children?: PublicCategory[];
}

export interface PublicLocation {
  city: string | null;
  region: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
}

/** Trust stats shown on profiles — server-controlled, never client-writable. */
export interface PublicTrustStats {
  averageRating: number;
  reviewCount: number;
  completedGigsCount: number;
}

export interface PublicUserProfile extends PublicTrustStats {
  id: string;
  userId: string;
  bio: string | null;
  photoUrl: string | null;
  location: PublicLocation;
  yearsOfExperience: number | null;
  availability: string;
  skills: string[];
  categories: PublicCategory[];
}

export interface PublicBusinessProfile extends PublicTrustStats {
  id: string;
  userId: string;
  businessName: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  location: {
    city: string | null;
    region: string | null;
    country: string | null;
  };
  categories: PublicCategory[];
}

/** Combined profile view for the authenticated user (includes KYC summary). */
export interface OwnProfile {
  userProfile: PublicUserProfile | null;
  businessProfile: PublicBusinessProfile | null;
  kycStatus: string;
}

/** Public profile visible to other users — sensitive fields stripped. */
export interface PublicProfileView {
  userId: string;
  fullName: string;
  roles: string[];
  userProfile: PublicUserProfile | null;
  businessProfile: PublicBusinessProfile | null;
  kycVerified: boolean;
}
