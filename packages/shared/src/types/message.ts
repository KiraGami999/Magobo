export interface ConversationParticipantSummary {
  userId: string;
  fullName: string;
}

export interface ConversationGigSummary {
  id: string;
  title: string;
  status: string;
}

export interface MessageAttachmentSummary {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedAt: string;
  downloadUrl: string;
}

export interface PublicMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderName: string;
  body: string;
  moderationStatus: string;
  attachments: MessageAttachmentSummary[];
  createdAt: string;
}

/** Inbox list item — no message bodies. */
export interface ConversationSummary {
  id: string;
  gig: ConversationGigSummary;
  proposalId: string;
  otherParticipant: ConversationParticipantSummary;
  lastMessageAt: string | null;
  updatedAt: string;
}

/** Thread view with recent messages. */
export interface PublicConversation extends ConversationSummary {
  messages: PublicMessage[];
  canSend: boolean;
}
