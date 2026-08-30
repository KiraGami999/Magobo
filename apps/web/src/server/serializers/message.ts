import type {
  Conversation,
  Gig,
  Message,
  MessageAttachment,
  Proposal,
  User,
} from '@magobo/db';
import type {
  ConversationSummary,
  MessageAttachmentSummary,
  PublicConversation,
  PublicMessage,
} from '@magobo/shared';

type ConversationWithRelations = Conversation & {
  gig: Pick<Gig, 'id' | 'title' | 'status'>;
  proposal: Pick<Proposal, 'id' | 'status'>;
  owner: Pick<User, 'id' | 'fullName'>;
  provider: Pick<User, 'id' | 'fullName'>;
  messages?: (Message & {
    sender: Pick<User, 'id' | 'fullName'>;
    attachments: MessageAttachment[];
  })[];
};

function otherParticipant(
  conversation: ConversationWithRelations,
  viewerId: string,
): { userId: string; fullName: string } {
  if (viewerId === conversation.ownerUserId) {
    return { userId: conversation.provider.id, fullName: conversation.provider.fullName };
  }
  return { userId: conversation.owner.id, fullName: conversation.owner.fullName };
}

function toAttachmentSummary(
  attachment: MessageAttachment,
  conversationId: string,
): MessageAttachmentSummary {
  return {
    id: attachment.id,
    originalFileName: attachment.originalFileName,
    mimeType: attachment.mimeType,
    fileSizeBytes: attachment.fileSizeBytes,
    uploadedAt: attachment.uploadedAt.toISOString(),
    downloadUrl: `/api/conversations/${conversationId}/attachments/${attachment.id}`,
  };
}

export function toPublicMessage(
  message: Message & {
    sender: Pick<User, 'id' | 'fullName'>;
    attachments: MessageAttachment[];
  },
  conversationId: string,
): PublicMessage {
  return {
    id: message.id,
    conversationId,
    senderUserId: message.senderUserId,
    senderName: message.sender.fullName,
    body: message.body,
    moderationStatus: message.moderationStatus,
    attachments: message.attachments.map((attachment) =>
      toAttachmentSummary(attachment, conversationId),
    ),
    createdAt: message.createdAt.toISOString(),
  };
}

export function toConversationSummary(
  conversation: ConversationWithRelations,
  viewerId: string,
): ConversationSummary {
  return {
    id: conversation.id,
    gig: {
      id: conversation.gig.id,
      title: conversation.gig.title,
      status: conversation.gig.status,
    },
    proposalId: conversation.proposalId,
    otherParticipant: otherParticipant(conversation, viewerId),
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

export function toPublicConversation(
  conversation: ConversationWithRelations,
  viewerId: string,
  canSend: boolean,
): PublicConversation {
  return {
    ...toConversationSummary(conversation, viewerId),
    canSend,
    messages: (conversation.messages ?? []).map((message) =>
      toPublicMessage(message, conversation.id),
    ),
  };
}
