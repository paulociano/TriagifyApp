/*
  Warnings:

  - You are about to drop the `ExamResult` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ExamResult" DROP CONSTRAINT "ExamResult_screeningId_fkey";

-- AlterTable
ALTER TABLE "public"."Screenings" ADD COLUMN     "examSummary" TEXT;

-- DropTable
DROP TABLE "public"."ExamResult";
