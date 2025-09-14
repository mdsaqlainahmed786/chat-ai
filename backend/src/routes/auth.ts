// src/routes/auth.ts
import express from "express";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";
import { ensureDefaultAiConversationForUser } from "../lib/ai"; // <-- import helper

const prisma = new PrismaClient();
export const authRouter = express.Router();

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

function getBearerToken(req: express.Request) {
  const h = req.headers.authorization;
  if (!h) return null;
  const m = h.match(/^Bearer (.+)$/);
  return m ? m[1] : null;
}

authRouter.get("/authorize", async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Token not found. Call getToken({ template: 'default' }) on client" });
    }
    const verified = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!verified || !verified.sub) {
      console.error("Token not verified or missing sub:", verified);
      return res.status(401).json({ error: "Token not verified" });
    }

    const clerkUserId = verified.sub;
    let user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (user) {
      const AiConv = await prisma.conversation.findFirst({
        where: {
          title: "AI-Assistant",
          participants: {
            some: { userId: user.id },
          },
        },
      });
      if (!AiConv) {
        try {
          await ensureDefaultAiConversationForUser(user.id);
        }
        catch (err) {
          console.error("Failed to initialize AI conversation for user:", user.id, err);
        }
      }
    }

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      user = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses?.[0]?.emailAddress ?? null,
          firstName: clerkUser.firstName ?? null,
          lastName: clerkUser.lastName ?? null,
          imageUrl: clerkUser.imageUrl ?? null,
          provider: (clerkUser.externalAccounts?.length ?? 0) > 0 ? "google" : "email",
        },
      });

      // IMPORTANT: initialize default AI conversation for this new user
      try {
        await ensureDefaultAiConversationForUser(user.id);
      } catch (err) {
        console.error("Failed to initialize AI conversation for user:", user.id, err);
      }
    }

    return res.json(user);
  } catch (err: any) {
    console.error("ERROR /auth/authorize verify:", err);
    const message = err?.message ?? String(err);
    return res.status(401).json({ error: "Authentication failed", details: message });
  }
});
