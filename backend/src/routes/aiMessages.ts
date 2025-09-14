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
        if (!userId) {
            userId = await getUserIdFromRequest(req);
        }
        if (!userId) return res.status(401).json({ ok: false, error: "not-authenticated" });

        const { conversationId, content } = req.body as { conversationId?: string; content?: string };
        if (!conversationId || !content) return res.status(400).json({ ok: false, error: "missing params" });

        // who is calling?
        const user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) return res.status(404).json({ ok: false, error: "user-not-found" });

        // check participant
        const isParticipant = await prisma.conversationParticipant.findUnique({
            where: { userId_conversationId: { userId: user.id, conversationId } },
        });
        if (!isParticipant) return res.status(403).json({ ok: false, error: "not a participant" });

        // Save user's message to DB
        const userMessage = await prisma.message.create({
            data: {
                conversationId,
                senderId: user.id,
                content,
                isAi: false,
            },
            include: { sender: true },
        });

        // Broadcast user's message (useful if sender's client didn't already broadcast)
        const io = req.app.get("io");
        if (io) {
            io.to(conversationId).emit("newMessage", {
                id: userMessage.id,
                conversationId: userMessage.conversationId,
                content: userMessage.content,
                imageUrl: userMessage.imageUrl,
                isAi: userMessage.isAi,
                createdAt: userMessage.createdAt,
                sender: {
                    id: userMessage.sender.id,
                    clerkId: userMessage.sender.clerkId,
                    firstName: userMessage.sender.firstName,
                    imageUrl: userMessage.sender.imageUrl,
                },
            });
        }

        // Fetch recent history to provide context to Gemini (last 30 messages)
        const history = await prisma.message.findMany({
            where: { conversationId },
            include: { sender: true },
            orderBy: { createdAt: "asc" },
            take: 50,
        });

        // Build prompt / context: you can craft a richer structure, but this is simple and effective
        const conversationText = history
            .map((m) => {
                const who = m.isAi ? "Assistant" : (m.sender.firstName ?? m.sender.clerkId ?? "User");
                return `${who}: ${m.content ?? ""}`;
            })
            .join("\n");

        const prompt = conversationText + `\nAssistant:`;
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
        });

        // The SDK returns a "response" you can read from
        const response = await result.response;
        // response.text() is a convenient helper
        let aiText = "";
        try {
            aiText = await response.text();
        } catch (e) {
            // fallback: inspect other fields
            aiText = JSON.stringify(response).slice(0, 2000);
        }

        // Ensure aiUser exists and save AI message
        const aiUser = await ensureAiUser();
        const aiMessage = await prisma.message.create({
            data: {
                conversationId,
                senderId: aiUser.id,
                content: aiText,
                isAi: true,
            },
            include: { sender: true },
        });

        // Emit the AI response via socket.io
        if (io) {
            io.to(conversationId).emit("newMessage", {
                id: aiMessage.id,
                conversationId: aiMessage.conversationId,
                content: aiMessage.content,
                imageUrl: aiMessage.imageUrl,
                isAi: aiMessage.isAi,
                createdAt: aiMessage.createdAt,
                sender: {
                    id: aiMessage.sender.id,
                    clerkId: aiMessage.sender.clerkId,
                    firstName: aiMessage.sender.firstName,
                    imageUrl: aiMessage.sender.imageUrl,
                },
            });
        }

        return res.json({ ok: true, aiMessage });
    } catch (err) {
        console.error("ai/message error:", err);
        return res.status(500).json({ ok: false, error: "server error" });
    }
});
