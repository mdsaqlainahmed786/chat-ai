/*
  Warnings:

  - You are about to drop the column `audioUrl` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "audioUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "audioUrl";
