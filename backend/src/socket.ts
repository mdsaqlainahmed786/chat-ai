import http from "http";
import { Server as IOServer } from "socket.io";
import { verifyToken } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";
import { Gauge } from "prom-client";
import { setOnlineUsers } from "./monitoring/requestCounter"; // adjust path

const prisma = new PrismaClient();
const onlineUsers = new Set<string>();

export function initSocketServer(server: http.Server) {
  const io = new IOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  const onlineUsers = new Set<string>();

  // AUTH MIDDLEWARE
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

      const clerkId = verified.sub;

      const localUser = await prisma.user.findUnique({ where: { clerkId } });
      if (!localUser) {
        return next(new Error("user-not-in-db"));
      }

      socket.data.clerkId = clerkId;
      socket.data.user = {
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
    const clerkId = socket.data.clerkId as string | undefined;
    console.log(`socket connected ${socket.id} clerkId=${clerkId}`);
    onlineUsers.add(clerkId!);
     if (clerkId) {
    setOnlineUsers(onlineUsers.size); // update gauge
  }

    // activeUsersGauge.set(onlineUsers.size);
    socket.emit("onlineUsers", Array.from(onlineUsers));
    socket.broadcast.emit("userOnline", { clerkId });
    io.emit("userOnline", { clerkId });

    socket.on("joinRoom", async (payload: { conversationId: string }, ack) => {
      try {
        const conversationId = payload?.conversationId;
        if (!conversationId) return ack?.({ ok: false, error: "conversationId required" });

        if (!clerkId) return ack?.({ ok: false, error: "not authenticated" });

        // Ensure user is a participant (using DB check, but by clerkId)
        const user = await prisma.user.findUnique({ where: { clerkId } });
        if (!user) return ack?.({ ok: false, error: "user not found" });

        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            userId_conversationId: { userId: user.id, conversationId },
          },
        });

        if (!participant) {
          return ack?.({ ok: false, error: "not a participant of this conversation" });
        }

        socket.join(conversationId);
        console.log(`clerkId=${clerkId} joined room ${conversationId}`);

        // Fetch messages
        const messages = await prisma.message.findMany({
          where: { conversationId },
          include: { sender: true },
          orderBy: { createdAt: "asc" },
        });

        const payloadMessages = messages.map((m) => ({
          id: m.id,
          conversationId: m.conversationId,
          content: m.content,
          imageUrl: m.imageUrl,
          audioUrl: m.audioUrl,
          isAi: m.isAi,
          createdAt: m.createdAt.toISOString(),
          sender: {
            clerkId: m.sender.clerkId,
            firstName: m.sender.firstName,
            imageUrl: m.sender.imageUrl,
          },
        }));

        return ack?.({ ok: true, messages: payloadMessages });
      } catch (err: any) {
        console.error("joinRoom error:", err);
        return ack?.({ ok: false, error: "server error" });
      }
    });
    socket.on("pinMessage", async ({ conversationId, messageId }) => {
      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: { pinnedMessageId: messageId },
        include: { pinnedMessage: { include: { sender: true } } },
      });
      io.to(conversationId).emit("messagePinned", {
        conversationId,
        pinnedMessage: updated.pinnedMessage,
      });
    });

socket.on("unpinMessage", async ({ conversationId }) => {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { pinnedMessageId: null },
  });
  io.to(conversationId).emit("messageUnpinned", {
    conversationId,
    pinnedMessage: null,
  });
});


    // Typing events now emit clerkId
    socket.on("typing", ({ conversationId }) => {
      socket.to(conversationId).emit("userTyping", { clerkId });
    });

    socket.on("stopTyping", ({ conversationId }) => {
      socket.to(conversationId).emit("userStopTyping", { clerkId });
    });

    // New message
    socket.on(
      "sendMessage",
      async (
        payload: { conversationId: string; content?: string; imageUrl?: string; audioUrl?: string; isAi?: boolean },
        ack
      ) => {
        const { conversationId, content, imageUrl, audioUrl, isAi } = payload;
        const clerkId = socket.data.clerkId;

        if (!clerkId) return ack?.({ ok: false, error: "not authenticated" });

        const sender = await prisma.user.findUnique({ where: { clerkId } });
        if (!sender) return ack?.({ ok: false, error: "user not found" });

        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            userId_conversationId: { userId: sender.id, conversationId },
          },
        });
        if (!participant) return ack?.({ ok: false, error: "not a participant" });

        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: sender.id,
            content: content ?? null,
            imageUrl: imageUrl ?? null,
            audioUrl: audioUrl ?? null,
            isAi: !!isAi,
          },
          include: { sender: true },
        });

        io.to(conversationId).emit("newMessage", {
          id: message.id,
          conversationId: message.conversationId,
          content: message.content,
          imageUrl: message.imageUrl,
          audioUrl: message.audioUrl,
          isAi: message.isAi,
          createdAt: message.createdAt,
          sender: {
            clerkId: message.sender.clerkId,
            firstName: message.sender.firstName,
            imageUrl: message.sender.imageUrl,
          },
        });

        return ack?.({ ok: true, messageId: message.id });
      }
    );


    socket.on("disconnect", (reason) => {
      console.log(`socket disconnected ${socket.id} reason=${reason}`);
      io.emit("userOffline", { clerkId });
      onlineUsers.delete(clerkId!);
        if (clerkId) {
      setOnlineUsers(onlineUsers.size); // update gauge
    }
      socket.broadcast.emit("userOffline", { clerkId });
    });
  });

  return io;
}
