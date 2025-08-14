-- AlterTable
ALTER TABLE "public"."Question" ADD COLUMN     "creatorId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
