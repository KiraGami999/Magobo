export interface ProjectParticipantSummary {
  userId: string;
  fullName: string;
  role: 'OWNER' | 'PROVIDER';
}

export interface MilestoneSummary {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  amountMinor: number | null;
  currency: string;
  status: string;
  dueAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
}

export interface DeliverableAttachmentSummary {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedAt: string;
  downloadUrl: string;
}

export interface DeliverableSummary {
  id: string;
  submissionNumber: number;
  notes: string;
  status: string;
  submittedByUserId: string;
  submittedByName: string;
  attachments: DeliverableAttachmentSummary[];
  createdAt: string;
}

export interface RevisionRequestSummary {
  id: string;
  deliverableId: string;
  message: string;
  requestedByName: string;
  createdAt: string;
}

/** Full project workspace for owner or awarded provider. */
export interface PublicProject {
  gigId: string;
  gigTitle: string;
  gigStatus: string;
  currency: string;
  startedAt: string | null;
  completedAt: string | null;
  owner: ProjectParticipantSummary;
  provider: ProjectParticipantSummary | null;
  milestones: MilestoneSummary[];
  deliverables: DeliverableSummary[];
  revisionRequests: RevisionRequestSummary[];
  canStart: boolean;
  canSubmitDeliverable: boolean;
  canRequestRevision: boolean;
  canAcceptDeliverable: boolean;
  canManageMilestones: boolean;
}

export interface ProjectGigSummary {
  id: string;
  title: string;
  status: string;
  role: 'OWNER' | 'PROVIDER';
  updatedAt: string;
}
