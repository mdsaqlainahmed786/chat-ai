// src/lib/ai.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Ensure there is a single "AI user" record in the DB.
 * We use clerkId = "ai_bot" to identify it.
 */
export async function ensureAiUser() {
  let aiUser = await prisma.user.findUnique({ where: { clerkId: "ai_bot" } });
  if (!aiUser) {
    aiUser = await prisma.user.create({
      data: {
        clerkId: "ai_bot",
        firstName: "Assistant",
        email: "assistant@example.com",
        imageUrl: null,
      },
    });
  }
  return aiUser;
}

/**
 * Ensure the default conversation between userId and the AI user exists.
 * Returns the Conversation row.
 */
export async function ensureDefaultAiConversationForUser(userId: string) {
  const aiUser = await ensureAiUser();
  const pairKey = `ai-${userId}`;

  let conv = await prisma.conversation.findUnique({
    where: { pairKey },
    include: { participants: true, messages: true },
  });

  if (conv) return conv;

  conv = await prisma.conversation.create({
    data: {
      title: "Assistant",
      pairKey,
      isGroup: false,
      participants: {
        create: [
          { userId }, 
          { userId: aiUser.id },
        ],
      },
      messages: {
        create: [
          {
            senderId: aiUser.id,
            content: "Hi — I'm your assistant. How can I help you today?",
            isAi: true,
          },
        ],
      },
    },
    include: { participants: true, messages: true },
  });

  return conv;
}
