import 'server-only';
import { prisma, type ProposalStatus, type User } from '@magobo/db';
import type {
  ListConversationsInput,
  ListMessagesInput,
  PaginatedResult,
  SendMessageInput,
} from '@magobo/shared';
import { ConflictError, NotFoundError, UnauthorizedError } from '@/server/errors';
import { notificationProvider } from '@/server/providers/notification';
import { storageProvider } from '@/server/providers/storage';
import { scanMessageContent } from '@/server/services/moderation.service';
import {
  toConversationSummary,
  toPublicConversation,
  toPublicMessage,
} from '@/server/serializers/message';

const ACTIVE_PROPOSAL_STATUSES: ProposalStatus[] = [
  'SUBMITTED',
  'SHORTLISTED',
  'NEGOTIATING',
  'ACCEPTED',
];

const conversationInclude = {
  gig: { select: { id: true, title: true, status: true } },
  proposal: { select: { id: true, status: true } },
  owner: { select: { id: true, fullName: true } },
  provider: { select: { id: true, fullName: true } },
} as const;

const messageInclude = {
  sender: { select: { id: true, fullName: true } },
  attachments: true,
} as const;

function isParticipant(user: User, conversation: { ownerUserId: string; providerUserId: string }): boolean {
  return user.id === conversation.ownerUserId || user.id === conversation.providerUserId;
}

function assertParticipant(user: User, conversation: { ownerUserId: string; providerUserId: string }): void {
  if (!isParticipant(user, conversation) && !user.roles.includes('ADMIN')) {
    throw new UnauthorizedError();
  }
}

function canSendMessages(proposalStatus: ProposalStatus): boolean {
  return ACTIVE_PROPOSAL_STATUSES.includes(proposalStatus);
}

export async function createConversationForProposal(input: {
  gigId: string;
  proposalId: string;
  ownerUserId: string;
  providerUserId: string;
}) {
  return prisma.conversation.create({
    data: {
      gigId: input.gigId,
      proposalId: input.proposalId,
      ownerUserId: input.ownerUserId,
      providerUserId: input.providerUserId,
    },
  });
}

async function ensureConversationForProposal(proposalId: string) {
  const existing = await prisma.conversation.findUnique({
    where: { proposalId },
    include: conversationInclude,
  });
  if (existing) return existing;

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { gig: { select: { ownerUserId: true } } },
  });

  if (!proposal) throw new NotFoundError('Proposal');

  return prisma.conversation.create({
    data: {
      gigId: proposal.gigId,
      proposalId: proposal.id,
      ownerUserId: proposal.gig.ownerUserId,
      providerUserId: proposal.providerUserId,
    },
    include: conversationInclude,
  });
}

async function getConversationOrThrow(conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: conversationInclude,
  });

  if (!conversation) throw new NotFoundError('Conversation');
  return conversation;
}

export async function listMyConversations(user: User, input: ListConversationsInput) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    OR: [{ ownerUserId: user.id }, { providerUserId: user.id }],
  };

  const [totalItems, conversations] = await Promise.all([
    prisma.conversation.count({ where }),
    prisma.conversation.findMany({
      where,
      include: conversationInclude,
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: conversations.map((conversation) => toConversationSummary(conversation, user.id)),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 1,
  } satisfies PaginatedResult<ReturnType<typeof toConversationSummary>>;
}

export async function getConversation(user: User, conversationId: string, input: ListMessagesInput) {
  const conversation = await getConversationOrThrow(conversationId);
  assertParticipant(user, conversation);

  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 50;
  const skip = (page - 1) * pageSize;

  const [messages, totalItems] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      include: messageInclude,
      orderBy: { createdAt: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  return {
    conversation: toPublicConversation(
      { ...conversation, messages },
      user.id,
      canSendMessages(conversation.proposal.status),
    ),
    messages: {
      items: messages.map((message) => toPublicMessage(message, conversationId)),
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize) || 1,
    },
  };
}

export async function getConversationByProposal(user: User, proposalId: string) {
  const conversation = await ensureConversationForProposal(proposalId);
  assertParticipant(user, conversation);

  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    include: messageInclude,
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  return toPublicConversation(
    { ...conversation, messages },
    user.id,
    canSendMessages(conversation.proposal.status),
  );
}

export async function sendMessage(
  user: User,
  conversationId: string,
  input: SendMessageInput,
  file?: { fileName: string; mimeType: string; data: Buffer },
) {
  if (user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Verify your account before sending messages.');
  }

  const conversation = await getConversationOrThrow(conversationId);
  assertParticipant(user, conversation);

  if (!canSendMessages(conversation.proposal.status)) {
    throw new ConflictError('This conversation is read-only.');
  }

  const moderation = scanMessageContent(input.body);

  const recipientUserId =
    user.id === conversation.ownerUserId
      ? conversation.providerUserId
      : conversation.ownerUserId;

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId,
        senderUserId: user.id,
        body: input.body,
        moderationStatus: moderation.status,
        moderationFlags: moderation.flags,
      },
      include: messageInclude,
    });

    if (file) {
      const stored = await storageProvider.store({
        namespace: `messages/${conversationId}`,
        originalFileName: file.fileName,
        mimeType: file.mimeType,
        data: file.data,
      });

      await tx.messageAttachment.create({
        data: {
          messageId: created.id,
          storageKey: stored.storageKey,
          originalFileName: stored.originalFileName,
          mimeType: stored.mimeType,
          fileSizeBytes: stored.fileSizeBytes,
        },
      });
    }

    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return tx.message.findUniqueOrThrow({
      where: { id: created.id },
      include: messageInclude,
    });
  });

  await notificationProvider.notify({
    event: 'MESSAGE_RECEIVED',
    recipientUserId,
    title: 'New message',
    body: `${user.fullName} sent you a message about "${conversation.gig.title}".`,
    metadata: { conversationId, messageId: message.id, gigId: conversation.gigId },
  });

  return toPublicMessage(message, conversationId);
}

export async function getMessageAttachmentFile(
  user: User,
  conversationId: string,
  attachmentId: string,
) {
  const conversation = await getConversationOrThrow(conversationId);
  assertParticipant(user, conversation);

  const attachment = await prisma.messageAttachment.findFirst({
    where: { id: attachmentId, message: { conversationId } },
  });

  if (!attachment) throw new NotFoundError('Attachment');
  return attachment;
}
