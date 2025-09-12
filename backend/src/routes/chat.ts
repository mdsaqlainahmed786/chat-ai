// src/routes/chat.ts
import { Router, Request, Response } from "express";
import express from "express";
import { getAuth } from "@clerk/express";
import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";
import cuid from "cuid";
import { getUserIdFromRequest } from "../utils/getUserId";

const prisma = new PrismaClient();
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export const chatRouter = Router();

/**
 * POST /chat/invite
 * - invite token banata hai 1:1 conversation ke liye.
 * - Auth required.
 */

chatRouter.post("/invite", async (req: Request, res: Response) => {
  try {
    const { userId: authUserId } = getAuth(req as any);
    console.log("🔸 getAuth userId:", authUserId);
    let clerkUserId = authUserId ?? null;

    // 2) plan B, get the userId from verifyToken not good.
    if (!clerkUserId) {
      clerkUserId = await getUserIdFromRequest(req);
    }
    console.log("🔸 clerkUserId after fallback:", clerkUserId);
    if (!clerkUserId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const inviter = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!inviter) {
      return res.status(400).json({ error: "Inviter not found in DB. Call /auth/authorize first." });
    }

    const expiresInSeconds = Number(req.body?.expiresInSeconds) || 60 * 60 * 24; // 24h default
    const token = cuid();
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const invite = await prisma.invite.create({
      data: {
        token,
        inviterId: inviter.id,
        expiresAt,
      },
    });

    const inviteUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/join/${inviter.id}/${inviter.clerkId}`;

    return res.json({
      invite: {
        token: invite.token,
        url: inviteUrl,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (err: any) {
    console.error("ERROR /chat/invite:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /chat/invite/:token
 * - Redeem invite:
 *   - Agar inviter db mein nahi hai toh 401 error
 *   - Agar invitee db mein nahi hai toh 401 with signup_required
 *   - Agar invite invalid/used/expired toh 4xx
 *   - Warna: 1:1 conversation create/khoj, invite used mark karo, conversationId return karo
 */
// POST /chat/create-with
// Body: { targetClerkId?: string, targetUserId?: string }
chatRouter.post("/create-with", async (req: Request, res: Response) => {
  try {
    let { userId } = getAuth(req as any);
    if (!userId) {
      userId = await getUserIdFromRequest(req);
    }
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const inviter = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!inviter) return res.status(400).json({ error: "Inviter not found in DB. Call /auth/authorize first." });
    // koi ek chalega nahi daudega
    const { targetClerkId, targetUserId } = req.body as { targetClerkId?: string; targetUserId?: string };

    let invitee: (Awaited<ReturnType<typeof prisma.user.findUnique>>) | null = null;
    if (targetUserId) {
      invitee = await prisma.user.findUnique({ where: { id: targetUserId } });
    } else if (targetClerkId) {
      invitee = await prisma.user.findUnique({ where: { clerkId: targetClerkId } });
    } else {
      return res.status(400).json({ error: "targetClerkId or targetUserId is required" });
    }

    if (!invitee) {
      return res.status(404).json({ error: "Target user not found in DB. They must sign up first." });
    }
    // if (invitee.id === inviter.id) {
    //   return res.status(400).json({ error: "Failed! Maybe you have already invited him to a conversation or you can't invite yourself to a conversation numb nut" });
    // }

    // Find existing 1:1 conversation between inviter & invitee
    const convs = await prisma.conversation.findMany({
      where: { isGroup: false },
      include: { participants: true },
    });
    
    let conversation = convs.find((c) => {
      const uids = c.participants.map((p) => p.userId).sort();
      return uids.length === 2 && uids.includes(inviter.id) && uids.includes(invitee!.id);
    });

    if (!conversation) {
      const created = await prisma.$transaction(async (tx) => {
        const conv = await tx.conversation.create({ data: { isGroup: false } });
        await tx.conversationParticipant.createMany({
          data: [
            { userId: inviter.id, conversationId: conv.id },
            { userId: invitee!.id, conversationId: conv.id },
          ],
          skipDuplicates: true,
        });
        return tx.conversation.findUnique({ where: { id: conv.id }, include: { participants: true } });
      });
      conversation = created as any;
    }

    return res.json({ conversationId: conversation?.id });
  } catch (err: any) {
    console.error("ERROR /chat/create-with:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

