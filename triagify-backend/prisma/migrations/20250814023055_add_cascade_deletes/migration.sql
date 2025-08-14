-- DropForeignKey
ALTER TABLE "public"."Answer" DROP CONSTRAINT "Answer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Answer" DROP CONSTRAINT "Answer_screeningId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DoctorPatient" DROP CONSTRAINT "DoctorPatient_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DoctorPatient" DROP CONSTRAINT "DoctorPatient_patientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ExamFile" DROP CONSTRAINT "ExamFile_screeningId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Question" DROP CONSTRAINT "Question_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Screenings" DROP CONSTRAINT "Screenings_patientId_fkey";

-- AddForeignKey
ALTER TABLE "public"."DoctorPatient" ADD CONSTRAINT "DoctorPatient_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorPatient" ADD CONSTRAINT "DoctorPatient_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Screenings" ADD CONSTRAINT "Screenings_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Answer" ADD CONSTRAINT "Answer_screeningId_fkey" FOREIGN KEY ("screeningId") REFERENCES "public"."Screenings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamFile" ADD CONSTRAINT "ExamFile_screeningId_fkey" FOREIGN KEY ("screeningId") REFERENCES "public"."Screenings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
