-- CreateEnum
CREATE TYPE "GigStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RECEIVING_PROPOSALS', 'NEGOTIATING', 'AWARDED', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUESTED', 'RESUBMITTED', 'COMPLETED', 'PAYMENT_RELEASED', 'REVIEWED', 'CANCELLED', 'DISPUTED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Gig" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "GigStatus" NOT NULL DEFAULT 'DRAFT',
    "budgetMinMinor" INTEGER,
    "budgetMaxMinor" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'MWK',
    "locationCity" TEXT,
    "locationRegion" TEXT,
    "locationCountry" TEXT,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "deadlineAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Gig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigAttachment" (
    "id" TEXT NOT NULL,
    "gigId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GigAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gig_ownerUserId_idx" ON "Gig"("ownerUserId");

-- CreateIndex
CREATE INDEX "Gig_categoryId_idx" ON "Gig"("categoryId");

-- CreateIndex
CREATE INDEX "Gig_status_idx" ON "Gig"("status");

-- CreateIndex
CREATE INDEX "Gig_deletedAt_idx" ON "Gig"("deletedAt");

-- CreateIndex
CREATE INDEX "Gig_publishedAt_idx" ON "Gig"("publishedAt");

-- CreateIndex
CREATE INDEX "Gig_locationCity_idx" ON "Gig"("locationCity");

-- CreateIndex
CREATE INDEX "GigAttachment_gigId_idx" ON "GigAttachment"("gigId");

-- AddForeignKey
ALTER TABLE "Gig" ADD CONSTRAINT "Gig_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gig" ADD CONSTRAINT "Gig_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigAttachment" ADD CONSTRAINT "GigAttachment_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
