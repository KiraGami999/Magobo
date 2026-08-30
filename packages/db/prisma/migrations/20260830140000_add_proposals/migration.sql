-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('SUBMITTED', 'SHORTLISTED', 'NEGOTIATING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "Gig" ADD COLUMN     "awardedProposalId" TEXT;

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "gigId" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "coverLetter" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MWK',
    "estimatedDays" INTEGER,
    "status" "ProposalStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalNegotiationEntry" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "amountMinor" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalNegotiationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Proposal_gigId_idx" ON "Proposal"("gigId");

-- CreateIndex
CREATE INDEX "Proposal_providerUserId_idx" ON "Proposal"("providerUserId");

-- CreateIndex
CREATE INDEX "Proposal_status_idx" ON "Proposal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_gigId_providerUserId_key" ON "Proposal"("gigId", "providerUserId");

-- CreateIndex
CREATE INDEX "ProposalNegotiationEntry_proposalId_idx" ON "ProposalNegotiationEntry"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "Gig_awardedProposalId_key" ON "Gig"("awardedProposalId");

-- AddForeignKey
ALTER TABLE "Gig" ADD CONSTRAINT "Gig_awardedProposalId_fkey" FOREIGN KEY ("awardedProposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_providerUserId_fkey" FOREIGN KEY ("providerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalNegotiationEntry" ADD CONSTRAINT "ProposalNegotiationEntry_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalNegotiationEntry" ADD CONSTRAINT "ProposalNegotiationEntry_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
