-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('PENDING_REVIEW', 'ACCEPTED', 'SUPERSEDED');

-- AlterTable
ALTER TABLE "Gig" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "GigMilestone" (
    "id" TEXT NOT NULL,
    "gigId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "amountMinor" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'MWK',
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "dueAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "submittedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GigMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigDeliverable" (
    "id" TEXT NOT NULL,
    "gigId" TEXT NOT NULL,
    "submittedByUserId" TEXT NOT NULL,
    "submissionNumber" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT NOT NULL,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigDeliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigDeliverableAttachment" (
    "id" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigDeliverableAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigRevisionRequest" (
    "id" TEXT NOT NULL,
    "gigId" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigRevisionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GigMilestone_gigId_idx" ON "GigMilestone"("gigId");

-- CreateIndex
CREATE INDEX "GigMilestone_status_idx" ON "GigMilestone"("status");

-- CreateIndex
CREATE INDEX "GigDeliverable_gigId_idx" ON "GigDeliverable"("gigId");

-- CreateIndex
CREATE INDEX "GigDeliverable_status_idx" ON "GigDeliverable"("status");

-- CreateIndex
CREATE INDEX "GigDeliverableAttachment_deliverableId_idx" ON "GigDeliverableAttachment"("deliverableId");

-- CreateIndex
CREATE INDEX "GigRevisionRequest_gigId_idx" ON "GigRevisionRequest"("gigId");

-- CreateIndex
CREATE INDEX "GigRevisionRequest_deliverableId_idx" ON "GigRevisionRequest"("deliverableId");

-- AddForeignKey
ALTER TABLE "GigMilestone" ADD CONSTRAINT "GigMilestone_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigMilestone" ADD CONSTRAINT "GigMilestone_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigDeliverable" ADD CONSTRAINT "GigDeliverable_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigDeliverable" ADD CONSTRAINT "GigDeliverable_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigDeliverableAttachment" ADD CONSTRAINT "GigDeliverableAttachment_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "GigDeliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigRevisionRequest" ADD CONSTRAINT "GigRevisionRequest_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigRevisionRequest" ADD CONSTRAINT "GigRevisionRequest_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "GigDeliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigRevisionRequest" ADD CONSTRAINT "GigRevisionRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
