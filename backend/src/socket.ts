// src/socket.ts
import http from "http";
import { Server as IOServer } from "socket.io";
import { verifyToken } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function initSocketServer(server: http.Server) {
  const io = new IOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // AUTH MIDDLEWARE: verify Clerk token -> resolve local User -> attach to socket.data imp hai
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        return next(new Error("no-auth-token"));
      }

      
      const verified = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      if (!verified || !verified.sub) {
        return next(new Error("invalid-token"));
      }

      const clerkUserId = verified.sub;

    
      const localUser = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });

      if (!localUser) {
        
        return next(new Error("user-not-in-db"));
      }

    
      socket.data.userId = localUser.id;       // <-- local DB PK (use this for joins/messages)
      socket.data.clerkId = localUser.clerkId; // <-- clerk user id (optional)
      socket.data.user = {
        id: localUser.id,
        clerkId: localUser.clerkId,
        firstName: localUser.firstName,
        imageUrl: localUser.imageUrl,
        email: localUser.email,
      };

      return next();
    } catch (err: any) {
      console.error("Socket auth error:", err?.message ?? err);
      return next(new Error("auth-failed"));
    }
  });

  
  io.engine.on("connection_error", (err) => {
    console.error("engine connection_error:", err);
  });

  io.on("connection", (socket) => {
    const localId = socket.data.userId;
    console.log(`socket connected ${socket.id} localUserId=${localId}`);

    socket.on("joinRoom", async (payload: { conversationId: string }, ack) => {
      try {
        const conversationId = payload?.conversationId;
        if (!conversationId) return ack?.({ ok: false, error: "conversationId required" });

        const userId = socket.data.userId as string | undefined;
        if (!userId) return ack?.({ ok: false, error: "not authenticated" });

      
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            userId_conversationId: { userId, conversationId },
          },
        });

        if (!participant) {
          return ack?.({ ok: false, error: "not a participant of this conversation" });
        }

        socket.join(conversationId);
        console.log(`user ${userId} joined room ${conversationId}`);
        return ack?.({ ok: true });
      } catch (err: any) {
        console.error("joinRoom error:", err);
        return ack?.({ ok: false, error: "server error" });
      }
    });

    
    socket.on(
      "sendMessage",
      async (payload: { conversationId: string; content?: string; imageUrl?: string; isAi?: boolean }, ack) => {
        try {
          const { conversationId, content, imageUrl, isAi } = payload;
          // console.log("sendMessage payload:", payload);
          // console.log("socket.data:", socket.data);
          // console.log("ConversationId:", conversationId);
          if (!conversationId) return ack?.({ ok: false, error: "conversationId required" });

          const userId = socket.data.userId as string | undefined;
          if (!userId) return ack?.({ ok: false, error: "not authenticated" });
          
        
          const participant = await prisma.conversationParticipant.findUnique({
            where: {
              userId_conversationId: { userId, conversationId },
            },
          });
          if (!participant) return ack?.({ ok: false, error: "not a participant" });

        
          const message = await prisma.message.create({
            data: {
              conversationId,
              senderId: userId,
              content: content ?? null,
              imageUrl: imageUrl ?? null,
              isAi: !!isAi,
            },
            include: { sender: true },
          });

         
          io.to(conversationId).emit("newMessage", {
            id: message.id,
            conversationId: message.conversationId,
            content: message.content,
            imageUrl: message.imageUrl,
            isAi: message.isAi,
            createdAt: message.createdAt,
            sender: {
              id: message.sender.id,
              clerkId: message.sender.clerkId,
              firstName: message.sender.firstName,
              imageUrl: message.sender.imageUrl,
            },
          });

          return ack?.({ ok: true, messageId: message.id });
        } catch (err: any) {
          console.error("sendMessage error:", err);
          return ack?.({ ok: false, error: "server error" });
        }
      }
    );

    socket.on("disconnect", (reason) => {
      console.log(`socket disconnected ${socket.id} reason=${reason}`);
    });
  });

  return io;
}
