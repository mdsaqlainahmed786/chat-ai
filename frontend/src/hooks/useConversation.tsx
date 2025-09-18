// src/hooks/useConversationSocket.ts
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";

type Msg = {
  id: string;
  conversationId: string;
  content?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  isAi: boolean;
  createdAt: string;
  sender: {
    id: string;
    clerkId?: string | null;
    firstName?: string | null;
    imageUrl?: string | null;
    audioUrl?: string | null;
  };
  temp?: boolean; // Add temp as optional property
};

export function useConversationSocket(conversationId?: string) {
  const { getToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [aiStreaming, setAiStreaming] = useState(false);
  const [connected, setConnected] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<Msg | null>(null);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
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

        socket.on("messageEdited", (updatedMessage: Msg) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m
            )
          );
        });

        socket.on("messageDeleted", ({ id }: { id: string }) => {
          setMessages((prev) => prev.filter((m) => m.id !== id));
        });

        socket.on("messagePinned", ({ pinnedMessage }) => {
          setPinnedMessage(pinnedMessage);
        });

        socket.on("messageUnpinned", () => {
          setPinnedMessage(null);
        });

        socket.on("onlineUsers", (users: string[]) => {
          setOnlineUsers(new Set(users));
        });

        socket.on("userOnline", ({ clerkId }) => {
          setOnlineUsers((prev) => new Set(prev).add(clerkId));
        });

        socket.on("userOffline", ({ clerkId }) => {
          setOnlineUsers((prev) => {
            const copy = new Set(prev);
            copy.delete(clerkId);
            return copy;
          });
        });

        socket.on("userTyping", ({ clerkId }) => {
          setTypingUser(clerkId);
        });

        socket.on("userStopTyping", ({ clerkId }) => {
          setTypingUser((prev) => (prev === clerkId ? null : prev));
        });

        socket.on("disconnect", (reason) => {
          console.log("socket disconnected", reason);
          if (!mounted) return;
          setConnected(false);
        });

        socket.on("connect_error", (err) => {
          console.error("socket connect_error:", err);
        });
        socket.on("aiStream", (m: Msg & { temp?: boolean }) => {
          if (!mounted) return;
          setAiStreaming(true);

          setMessages((prev) => {
            const existing = prev.find((pm) => pm.isAi && pm.temp);
            if (existing) {
              return prev.map((pm) =>
                pm.isAi && pm.temp ? { ...pm, content: m.content } : pm
              );
            }
            return [...prev, m];
          });
        });
        socket.on("newMessage", (m: Msg) => {
          console.log("newMessage received:", m);
          if (!mounted) return;

          setMessages((prev) => {
            // Remove temp AI message
            const filtered = prev.filter((pm) => !(pm.isAi && pm.temp));
            if (filtered.some((pm) => pm.id === m.id)) return filtered;

            const next = [...filtered, m];
            next.sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            );
            return next;
          });

          // ✅ AI finished streaming
          if (m.isAi) {
            setAiStreaming(false);
          }
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

    const fetchPinnedMessage = async () => {
      const token = await getToken({ template: "default" });
      if (!token) {
        console.warn("No token from Clerk");
        return;
      }
      setToken(token);
      try {
        const baseUrl =
          import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
        const res = await axios.get(`${baseUrl}/chat/pinned-message/${conversationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.pinnedMessage) {
          setPinnedMessage(res.data.pinnedMessage);
        } else {
          setPinnedMessage(null);
        }
      } catch (err) {
        console.error("Failed to fetch pinned message:", err);
      }
    };
useEffect(() => {
if (!conversationId) return;
  fetchPinnedMessage();
}, [conversationId, token]);
  interface SendMessageResult {
    ok: boolean;
    messageId?: string;
    error?: string;
  }
  const sendMessage = async (payload: {
    content?: string;
    imageUrl?: string;
    isAi?: boolean;
    audioUrl?: string;
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

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const emitTyping = () => {
    if (!socketRef.current) return;
    socketRef.current.emit("typing", { conversationId });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stopTyping", { conversationId });
    }, 2000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setPreviewAudio(URL.createObjectURL(blob));
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const sendAudioMessage = async () => {
    if (!audioBlob || !conversationId) {
      console.error("No audioBlob or conversationId");
      return;
    }

    console.log("Uploading audio message...", audioBlob);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("conversationId", conversationId);

      const res = await fetch(
        `${import.meta.env.VITE_SOCKET_URL}/chat/upload-audio`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${await getToken({ template: "default" })}`,
          },
        }
      );

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      console.log("Audio uploaded:", data);
      setPreviewAudio(null);
      setAudioBlob(null);
    } catch (err) {
      console.error("Error uploading audio:", err);
    } finally {
      setRecording(false);
    }
  };

  return {
    connected,
    messages,
    sendMessage,
    onlineUsers,
    typingUser,
    aiStreaming,
    emitTyping,
    recording,
    startRecording,
    stopRecording,
    previewAudio,
    setPreviewAudio,
    setAudioBlob,
    audioBlob,
    sendAudioMessage,
    pinnedMessage,
    fetchPinnedMessage
  };
}
