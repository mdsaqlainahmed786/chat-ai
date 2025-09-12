// src/hooks/useConversationSocket.ts
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@clerk/clerk-react";

type Msg = {
  id: string;
  conversationId: string;
  content?: string | null;
  imageUrl?: string | null;
  isAi: boolean;
  createdAt: string;
  sender: {
    id: string;
    clerkId?: string | null;
    firstName?: string | null;
    imageUrl?: string | null;
  };
};

export function useConversationSocket(conversationId?: string) {
  const { getToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        // get token from Clerk
        const token = await getToken({ template: "default" });
        if (!token) {
          console.warn("No token from Clerk");
          return;
        }

        const baseUrl =
          import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

        const socket: Socket = io(baseUrl, {
          auth: { token },
          transports: ["websocket"],
          autoConnect: true,
        });

        socketRef.current = socket;
        interface handleJoinAck {
          ok: boolean;
          error?: string;
          messages?: Msg[];
        }
        const handleJoinAck = (res: handleJoinAck | undefined) => {
          if (!mounted) return;
          if (!res) {
            console.warn("joinRoom ack missing");
            return;
          }
          if (!res.ok) {
            console.warn("joinRoom failed:", res.error ?? res);
            return;
          }
          // initialize messages from server
          // ensure they are sorted ascending by createdAt
          const serverMessages: Msg[] = Array.isArray(res.messages)
            ? res.messages
            : [];
          serverMessages.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setMessages(serverMessages);
        };

        socket.on("connect", () => {
          console.log("socket connected", socket.id);
          if (!mounted) return;
          setConnected(true);

          if (conversationId) {
            socket.emit("joinRoom", { conversationId }, handleJoinAck);
          }
        });

        socket.on("disconnect", (reason) => {
          console.log("socket disconnected", reason);
          if (!mounted) return;
          setConnected(false);
        });

        socket.on("connect_error", (err) => {
          console.error("socket connect_error:", err);
        });

        socket.on("newMessage", (m: Msg) => {
          console.log("newMessage received:", m);
          if (!mounted) return;

          setMessages((prev) => {
            // avoid duplicate messages (same id)
            if (prev.some((pm) => pm.id === m.id)) return prev;
            // append and keep chronological order
            const next = [...prev, m];
            next.sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            );
            return next;
          });
        });
      } catch (err) {
        console.error("socket start error:", err);
      }
    };

    start();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("connect_error");
        socketRef.current.off("newMessage");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [getToken, conversationId]);
  interface SendMessageResult {
    ok: boolean;
    messageId?: string;
    error?: string;
  }
  const sendMessage = async (payload: {
    content?: string;
    imageUrl?: string;
    isAi?: boolean;
  }) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      throw new Error("not connected");
    }

    return new Promise<{ ok: boolean; messageId?: string; error?: string }>(
      (resolve) => {
        socket.emit(
          "sendMessage",
          { conversationId, ...payload },
          (res: SendMessageResult) => {
            if (!res?.ok) {
              console.warn("sendMessage error ack:", res);
              resolve({ ok: false, error: res?.error });
            } else {
              resolve({ ok: true, messageId: res.messageId });
            }
          }
        );
      }
    );
  };

  return { connected, messages, sendMessage };
}
