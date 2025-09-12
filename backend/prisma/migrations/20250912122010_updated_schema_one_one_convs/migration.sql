/*
  Warnings:

  - A unique constraint covering the columns `[pairKey]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Conversation" ADD COLUMN     "pairKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_pairKey_key" ON "public"."Conversation"("pairKey");
