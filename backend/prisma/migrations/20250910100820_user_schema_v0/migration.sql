/*
  Warnings:

  - You are about to drop the column `membership` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."MembershipPlan" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM');

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "membership",
ADD COLUMN     "membershipId" TEXT,
ADD COLUMN     "membershipPlan" "public"."MembershipPlan" DEFAULT 'BASIC';

-- CreateTable
CREATE TABLE "public"."Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "public"."MembershipPlan" NOT NULL,
    "aiBlogsLeft" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_key" ON "public"."Membership"("userId");

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
