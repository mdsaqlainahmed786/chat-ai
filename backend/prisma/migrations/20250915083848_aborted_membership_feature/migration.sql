/*
  Warnings:

  - You are about to drop the column `membershipId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `membershipPlan` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Membership` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Membership" DROP CONSTRAINT "Membership_userId_fkey";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "membershipId",
DROP COLUMN "membershipPlan";

-- DropTable
DROP TABLE "public"."Membership";

-- DropEnum
DROP TYPE "public"."MembershipPlan";
