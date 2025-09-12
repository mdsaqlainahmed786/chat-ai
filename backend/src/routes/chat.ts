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
function makePairKey(a: string, b: string) {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}


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

    const { targetClerkId, targetUserId } = req.body as { targetClerkId?: string; targetUserId?: string };
    let invitee = null;
    if (targetUserId) {
      invitee = await prisma.user.findUnique({ where: { id: targetUserId } });
    } else if (targetClerkId) {
      invitee = await prisma.user.findUnique({ where: { clerkId: targetClerkId } });
    } else {
      return res.status(400).json({ error: "targetClerkId or targetUserId is required" });
    }
    if (!invitee) return res.status(404).json({ error: "Target user not found in DB." });
    if (invitee.id === inviter.id) return res.status(400).json({ error: "cannot invite yourself" });


    const pairKey = makePairKey(inviter.id, invitee.id);

    // conversation dhundho with pair key
    let conversation = await prisma.conversation.findUnique({
      where: { pairKey },
      include: { participants: true },
    });

    // If not found, create it in a transaction (and set pairKey)
    if (!conversation) {
      const created = await prisma.$transaction(async (tx) => {
        const conv = await tx.conversation.create({
          data: {
            isGroup: false,
            pairKey,
          },
        });
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

chatRouter.get("/conversations", async (req: Request, res: Response) => {
  try {
    let { userId } = getAuth(req as any);
    if (!userId) {
      userId = await getUserIdFromRequest(req);
    }
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) return res.status(400).json({ error: "User not found in DB. Call /auth/authorize first." });
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: dbUser.id } },
      },
      include: {
        participants: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(conversations);
  } catch (err: any) {
    console.error("ERROR /chat/conversations:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /chat/create-group
// Body: { title: string, memberClerkIds: string[] }
chatRouter.post("/create-group", async (req: Request, res: Response) => {
  try {
    let { userId } = getAuth(req as any);
    if (!userId) userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const creator = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!creator) return res.status(400).json({ error: "Creator not found in DB" });

    const { title, memberClerkIds } = req.body as { title: string; memberClerkIds: string[] };

    if (!title || !memberClerkIds || memberClerkIds.length === 0) {
      return res.status(400).json({ error: "title and memberClerkIds are required" });
    }
    const members = await prisma.user.findMany({
      where: { clerkId: { in: memberClerkIds } },
    });

    if (members.length === 0) return res.status(400).json({ error: "No valid members found" });

    const allMembers = [...members.map((m) => m.id), creator.id];
    const uniqueMembers = Array.from(new Set(allMembers));

    const created = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          isGroup: true,
          title,
        },
      });
      await tx.conversationParticipant.createMany({
        data: uniqueMembers.map((uid) => ({
          userId: uid,
          conversationId: conv.id,
        })),
        skipDuplicates: true,
      });
      return tx.conversation.findUnique({
        where: { id: conv.id },
        include: { participants: { include: { user: true } } },
      });
    });

    return res.json({ conversation: created });
  } catch (err: any) {
    console.error("ERROR /chat/create-group:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /chat/:conversationId/add-member
// Body: { targetClerkId: string }
chatRouter.post("/:conversationId/add-member", async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    let { userId } = getAuth(req as any);
    if (!userId) userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const requester = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!requester) return res.status(400).json({ error: "Requester not found" });

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || !conversation.isGroup) return res.status(404).json({ error: "Group not found" });

    const { targetClerkId } = req.body as { targetClerkId: string };
    const targetUser = await prisma.user.findUnique({ where: { clerkId: targetClerkId } });
    if (!targetUser) return res.status(404).json({ error: "Target user not found" });

    await prisma.conversationParticipant.create({
      data: { userId: targetUser.id, conversationId },
    });

    return res.json({ ok: true });
  } catch (err: any) {
    console.error("ERROR /chat/:conversationId/add-member:", err);
    return res.status(500).json({ error: "Server error" });
  }
});
