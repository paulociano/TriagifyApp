-- CreateTable
CREATE TABLE "public"."ExamFile" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "screeningId" TEXT NOT NULL,

    CONSTRAINT "ExamFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ExamFile" ADD CONSTRAINT "ExamFile_screeningId_fkey" FOREIGN KEY ("screeningId") REFERENCES "public"."Screenings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
