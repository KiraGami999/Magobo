export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalGigs: number;
  openGigs: number;
  pendingKycCases: number;
  openReports: number;
  flaggedMessages: number;
}

export interface AdminUserSummary {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  status: string;
  kycStatus: string | null;
  createdAt: string;
}

export interface AdminGigSummary {
  id: string;
  title: string;
  status: string;
  ownerName: string;
  ownerUserId: string;
  categoryName: string;
  createdAt: string;
}

export interface AdminReportSummary {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  description: string;
  status: string;
  reporterName: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AdminFlaggedMessageSummary {
  id: string;
  conversationId: string;
  gigTitle: string | null;
  senderName: string;
  body: string;
  moderationFlags: string[];
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
