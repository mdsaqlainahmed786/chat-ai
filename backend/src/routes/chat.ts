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
    let clerkUserId = authUserId ?? null;
    if (!clerkUserId) {
      clerkUserId = await getUserIdFromRequest(req);
    }
    if (!clerkUserId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const inviter = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!inviter) {
      return res.status(400).json({ error: "Inviter not found in DB. Call /auth/authorize first." });
    }
    if (inviter.inviteLink) {
      return res.json({
        invite: {
          url: inviter.inviteLink,
        },
      });
    }
    const inviteLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/join/${inviter.clerkId}`;
    await prisma.user.update({
      where: {
        id: inviter.id,
        clerkId: clerkUserId
      },
      data: { inviteLink },
    });

    return res.json({
      invite: {
        url: inviteLink
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
// Body: { title: string, ExistingMemberClerkIds: string[] }
chatRouter.post("/create-group", async (req: Request, res: Response) => {
  try {
    let { userId } = getAuth(req as any);
    if (!userId) userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const creator = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!creator) return res.status(400).json({ error: "Creator not found in DB" });

    const { title, ExistingMemberClerkIds } = req.body as {
      title?: string;
      ExistingMemberClerkIds?: string[];
    };

    if (!title || !ExistingMemberClerkIds || !Array.isArray(ExistingMemberClerkIds)) {
      return res.status(400).json({ error: "title and ExistingMemberClerkIds are required" });
    }
    if (ExistingMemberClerkIds.length < 2) {
      return res
        .status(400)
        .json({ error: "You must add at least two existing members to create a group" });
    }

    const users = await prisma.user.findMany({
      where: { clerkId: { in: ExistingMemberClerkIds } },
    });

    const foundClerkIds = users.map((u) => u.clerkId);
    const missing = ExistingMemberClerkIds.filter((c) => !foundClerkIds.includes(c));
    if (missing.length > 0) {
      return res
        .status(400)
        .json({ error: "Some users not found in DB", missing });
    }

    const targetUserIds = users.map((u) => u.id);
    const failedCandidates: string[] = [];

    for (const targetId of targetUserIds) {
      const creatorConvs = await prisma.conversationParticipant.findMany({
        where: { userId: creator.id },
        select: { conversationId: true },
      });
      const creatorConvIds = creatorConvs.map((c) => c.conversationId);

      const commonConv = await prisma.conversationParticipant.findFirst({
        where: {
          userId: targetId,
          conversationId: { in: creatorConvIds },
        },
        include: { conversation: true },
      });


      if (!commonConv) {
        const targetUser = users.find((u) => u.id === targetId);
        failedCandidates.push(targetUser?.clerkId ?? targetId);
      }
    }

    if (failedCandidates.length > 0) {
      return res.status(400).json({
        error: "Some users are not eligible: you must have a prior 1:1 conversation with them",
        failedCandidates,
      });
    }


    const allMemberIds = Array.from(new Set([...targetUserIds, creator.id]));

    const created = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          isGroup: true,
          title,
        },
      });

      await tx.conversationParticipant.createMany({
        data: allMemberIds.map((uid) => ({
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

chatRouter.delete("/delete-group", async (req, res) => {
  try {
    let { userId } = getAuth(req as any);
    if (!userId) userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const deleter = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!deleter) return res.status(400).json({ error: "User not found in DB" });
    const { conversationId } = req.body as { conversationId?: string };
    if (!conversationId) return res.status(400).json({ error: "conversationId is required" });
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    if (!conversation.isGroup) return res.status(400).json({ error: "Not a group conversation" });
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: deleter.id },
    });
    if (!isParticipant) return res.status(403).json({ error: "You are not a participant of this group" });
    await prisma.conversationParticipant.deleteMany({ where: { conversationId } });
    await prisma.conversation.delete({ where: { id: conversationId }, });
    return res.json({ message: "Group conversation deleted" });
  } catch (err: any) {
    console.error("ERROR /chat/delete-group:", err);
    return res.status(500).json({ error: "Server error" });
  }
})