-- CreateEnum
CREATE TYPE "NotificationEvent" AS ENUM ('PROPOSAL_SUBMITTED', 'PROPOSAL_SHORTLISTED', 'PROPOSAL_REJECTED', 'PROPOSAL_ACCEPTED', 'PROPOSAL_WITHDRAWN', 'PROPOSAL_COUNTER_OFFER', 'MESSAGE_RECEIVED', 'PROJECT_STARTED', 'MILESTONE_SUBMITTED', 'MILESTONE_APPROVED', 'DELIVERABLE_SUBMITTED', 'REVISION_REQUESTED', 'PROJECT_COMPLETED', 'REVIEW_RECEIVED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "event" "NotificationEvent" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
