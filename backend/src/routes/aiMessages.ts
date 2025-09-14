import express from "express";
import { getAuth } from "@clerk/express";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ensureAiUser } from "../lib/ai";
import { getUserIdFromRequest } from "../utils/getUserId";


const prisma = new PrismaClient();
export const aiMessagesRouter = express.Router();

// initialize SDK once
if (!process.env.GOOGLE_GEMINI_API_KEY) {
  console.warn("GOOGLE_GEMINI_API_KEY not set — AI will not work until configured.");
}
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: process.env.GOOGLE_GEMINI_MODEL || "gemini-2.0-flash" });

aiMessagesRouter.post("/message", async (req, res) => {
  try {
    let { userId } = getAuth(req);
    if (!userId) userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ ok: false, error: "not-authenticated" });

    const { conversationId, content } = req.body;
    if (!conversationId || !content) return res.status(400).json({ ok: false, error: "missing params" });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ ok: false, error: "user-not-found" });

    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: { userId_conversationId: { userId: user.id, conversationId } },
    });
    if (!isParticipant) return res.status(403).json({ ok: false, error: "not a participant" });

    const userMessage = await prisma.message.create({
      data: { conversationId, senderId: user.id, content, isAi: false },
      include: { sender: true },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(conversationId).emit("newMessage", {
        ...userMessage,
        sender: {
          id: userMessage.sender.id,
          clerkId: userMessage.sender.clerkId,
          firstName: userMessage.sender.firstName,
          imageUrl: userMessage.sender.imageUrl,
        },
      });
    }

    const history = await prisma.message.findMany({
      where: { conversationId },
      include: { sender: true },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
    const conversationText = history
      .map((m) => `${m.isAi ? "Assistant" : m.sender.firstName ?? "User"}: ${m.content ?? ""}`)
      .join("\n");
    const prompt = conversationText + `\nAssistant:`;

    const stream = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const aiUser = await ensureAiUser();
    let finalText = "";

    for await (const chunk of stream.stream) {
      const chunkText = chunk.text();
      if (!chunkText) continue;

      finalText += chunkText;

      if (io) {
        io.to(conversationId).emit("aiStream", {
          conversationId,
          content: finalText,
          isAi: true,
          temp: true,
          createdAt: new Date().toISOString()
        });
      }
    }


    const aiMessage = await prisma.message.create({
      data: { conversationId, senderId: aiUser.id, content: finalText, isAi: true },
      include: { sender: true },
    });


    if (io) {
      io.to(conversationId).emit("newMessage", {
        ...aiMessage,
        sender: {
          id: aiMessage.sender.id,
          clerkId: aiMessage.sender.clerkId,
          firstName: aiMessage.sender.firstName,
          imageUrl: aiMessage.sender.imageUrl,
        },
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("ai/message error:", err);
    return res.status(500).json({ ok: false, error: "server error" });
  }
});


aiMessagesRouter.delete("/delete-chat-history", async (req, res) => {
  try {
    let { userId } = getAuth(req);
    if (!userId) userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ ok: false, error: "not-authenticated" });
    const { conversationId } = req.body;
    if (!conversationId) return res.status(400).json({ ok: false, error: "missing conversationId" });
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ ok: false, error: "user-not-found" });
    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: { userId_conversationId: { userId: user.id, conversationId } },
    });
    if (!isParticipant) return res.status(403).json({ ok: false, error: "not a participant" });
    await prisma.message.deleteMany({ where: { conversationId } });
    return res.json({ ok: true });
  } catch (err) {
    console.error("ai/delete-chat-history error:", err);
    return res.status(500).json({ ok: false, error: "server error" });
  }
})
