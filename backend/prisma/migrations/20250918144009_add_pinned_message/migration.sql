/*
  Warnings:

  - A unique constraint covering the columns `[pinnedMessageId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Conversation" ADD COLUMN     "pinnedMessageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_pinnedMessageId_key" ON "public"."Conversation"("pinnedMessageId");

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_pinnedMessageId_fkey" FOREIGN KEY ("pinnedMessageId") REFERENCES "public"."Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
