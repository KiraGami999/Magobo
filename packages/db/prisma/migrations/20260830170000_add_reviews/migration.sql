-- CreateTable
CREATE TABLE "GigReview" (
    "id" TEXT NOT NULL,
    "gigId" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "revieweeUserId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GigReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GigReview_revieweeUserId_idx" ON "GigReview"("revieweeUserId");

-- CreateIndex
CREATE INDEX "GigReview_gigId_idx" ON "GigReview"("gigId");

-- CreateIndex
CREATE UNIQUE INDEX "GigReview_gigId_reviewerUserId_key" ON "GigReview"("gigId", "reviewerUserId");

-- AddForeignKey
ALTER TABLE "GigReview" ADD CONSTRAINT "GigReview_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigReview" ADD CONSTRAINT "GigReview_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigReview" ADD CONSTRAINT "GigReview_revieweeUserId_fkey" FOREIGN KEY ("revieweeUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
