import React, { useState, useRef, useEffect } from "react";
import { useConversationSocket } from "../hooks/useConversation";
import {
  Image as ImageIcon,
  X,
  Send,
  Sparkles,
  MoreVertical,
  Square,
  Mic,
  PinIcon,
  ArrowLeft,
  Users,
  Trash2,
  Edit,
  Pin,
  PinOff,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import TextareaAutosize from "react-textarea-autosize";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AiConversationAvatar from "@/components/AiConversationAvatar";
import AudioMessage from "@/components/AudioMessage";

type ConversationInfo = {
  pairKey?: string | null;
  id: string;
  title?: string | null;
  isGroup: boolean;
  participants: {
    user: {
      id: string;
      clerkId: string;
      firstName?: string | null;
      lastName?: string | null;
      imageUrl?: string | null;
    };
  }[];
};

export default function Conversation() {
  const [conversationInfo, setConversationInfo] =
    useState<ConversationInfo | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const { getToken, userId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [editMessageId, setEditMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const [aiConversationPairKey, setAiConversationPairKey] = useState<
    string | null
  >(null);
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  const {
    connected,
    messages,
    sendMessage,
    aiStreaming,
    onlineUsers,
    typingUser,
    emitTyping,
    recording,
    startRecording,
    stopRecording,
    previewAudio,
    sendAudioMessage,
    setPreviewAudio,
    setAudioBlob,
    pinnedMessage,
    fetchPinnedMessage,
    uploadingRecording
  } = useConversationSocket(conversationId);

  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!conversationId) {
      setConversationInfo(null);
      setLoadingInfo(false);
      return;
    }

    let cancelled = false;
    const fetchConversation = async () => {
      setLoadingInfo(true);
      const token = await getToken({ template: "default" });
      if (!token) {
        console.warn("No token from Clerk");
        setLoadingInfo(false);
        return;
      }
      const baseUrl =
        import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
      try {
        const res = await axios.get<ConversationInfo[]>(
          `${baseUrl}/chat/conversations`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        //@ts-expect-error ignore
        const found = res.data.conversations?.find((c) => c.id === conversationId) ?? null;
        if (!cancelled) {
          setConversationInfo(found);
          setAiConversationPairKey(found?.pairKey ?? null);
        }
      } catch (err) {
        console.error("fetchConversation error:", err);
        if (!cancelled) setConversationInfo(null);
      } finally {
        if (!cancelled) setLoadingInfo(false);
      }
    };

    fetchConversation();
    return () => {
      cancelled = true;
    };
  }, [conversationId, getToken]);

  let headerName = "Chat Room";
  let headerAvatar: string | null = null;
  let otherUserId: string | null = null;

  if (conversationInfo) {
    if (conversationInfo.isGroup) {
      headerName = conversationInfo.title ?? "Unnamed Group";
    } else {
      const other = conversationInfo.participants.find(
        (p) => p.user.clerkId !== userId
      )?.user;
      if (other) {
        headerName =
          `${other.firstName ?? ""} ${other.lastName ?? ""}`.trim() ||
          other.clerkId;
        headerAvatar = other.imageUrl ?? null;
        otherUserId = other.clerkId;
      }
    }
  }

  if (!conversationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No conversation selected
            </h2>
            <p className="text-gray-600 mb-6">
              Please select a conversation to start chatting.
            </p>
            <Button onClick={() => navigate("/chats")} className="w-full">
              Go Back to Chats
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const responseFromAI = async (content: string) => {
    try {
      const token = await getToken({ template: "default" });
      if (!token) {
        console.warn("No token available for AI call");
        return;
      }
      const baseUrl =
        import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
      axios
        .post(
          `${baseUrl}/ai/message`,
          { conversationId, content },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((res) => {
          if (!res.data?.ok) {
            console.warn("AI endpoint responded with error:", res.data);
          }
        })
        .catch((err) => {
          console.error("AI call failed:", err);
        });
    } catch (err) {
      console.error("sendMessage failed:", err);
    }
  };

  const handleSend = async () => {
    if ((!text.trim() && !selectedImage) || !conversationId) return;

    if (selectedImage) {
      try {
        const token = await getToken({ template: "default" });
        if (!token) return;

        const formData = new FormData();
        formData.append("image", selectedImage);
        formData.append("conversationId", conversationId);
        setImageUploading(true);
        const baseUrl =
          import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
        await axios.post(`${baseUrl}/chat/upload-image`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        setSelectedImage(null);
        setPreviewUrl(null);
        setImageUploading(false);
        setText("");
        return;
      } catch (err) {
        console.error("Image upload failed:", err);
        return;
      } finally {
        setImageUploading(false);
      }
    }

    const content = text.trim();
    if (
      conversationInfo?.title === "AI-Assistant" &&
      !conversationInfo?.isGroup
    ) {
      responseFromAI(content);
      setText("");
      return;
    } else if (content.includes("@AI")) {
      responseFromAI(content);
      setText("");
      return;
    }
    await sendMessage({ content });
    setText("");
  };

  const handleDeleteChat = async () => {
    if (!conversationId) return;
    try {
      const token = await getToken({ template: "default" });
      if (!token) {
        console.warn("No token from Clerk");
        return;
      }
      const baseUrl =
        import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
      const res = await axios.delete(`${baseUrl}/ai/delete-chat-history`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { conversationId },
      });
      if (res.data?.ok) {
        console.log("Chat history deleted successfully");
        setIsDeleteOpen(false);
        navigate("/chats");
      } else {
        console.warn("Failed to delete chat history:", res.data);
      }
    } catch (err) {
      console.error("Error deleting chat history:", err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (aiStreaming) return;
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEditMessage = async (editMessageId: string) => {
    if (!conversationId) return;
    try {
      const token = await getToken({ template: "default" });
      if (!token) {
        console.warn("No token from Clerk");
        return;
      }
      const baseUrl =
        import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
      const res = await axios.put(
        `${baseUrl}/chat/edit-message`,
        {
          messageId: editMessageId,
          newContent: editContent,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data?.message) {
        console.log("Message edited successfully");
        fetchPinnedMessage();
      } else {
        console.warn("Failed to edit message:", res.data);
      }

      if (res.data?.ok) {
        console.log("Message edited successfully");
        setEditMessageId(null);
        setEditContent("");
      } else {
        console.warn("Failed to edit message:", res.data);
      }
    } catch (err) {
      console.error("Error editing message:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = await getToken({ template: "default" });
      if (!token) {
        console.warn("No token from Clerk");
        return;
      }
      const baseUrl =
        import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
      const res = await axios.delete(`${baseUrl}/chat/delete-message`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { messageId: id },
      });
      if (res.data?.message) {
        console.log("Message deleted successfully");
        fetchPinnedMessage();
      }

      if (res.data?.ok) {
        console.log("Message deleted successfully");
      } else {
        console.warn("Failed to delete message:", res.data);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleUnpinMessage = async (messageId: string) => {
    if (!conversationId) return;
    const token = await getToken({ template: "default" });
    if (!token) {
      console.warn("No token from Clerk");
      return;
    }
    const baseUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
    await axios.put(
      `${baseUrl}/chat/unpin-message`,
      { conversationId, messageId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  const handlePinMessage = async (messageId: string) => {
    if (!conversationId) return;
    const token = await getToken({ template: "default" });
    if (!token) {
      console.warn("No token from Clerk");
      return;
    }
    const baseUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
    await axios.put(
      `${baseUrl}/chat/pin-message`,
      { conversationId, messageId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex flex-col">
      {/* Header */}
      <div className="rounded-none py-4 bg-white/70 backdrop-blur-sm border-b border-purple-100 border-x-0 border-t-0 shadow-sm sticky top-0 z-10">
        <div>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/chats")}
                className="hover:bg-purple-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-3">
                {loadingInfo ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <Avatar className="w-10 h-10 border-2 border-purple-200">
                        {conversationInfo?.title === "AI-Assistant" &&
                        !conversationInfo.isGroup ? (
                          <AiConversationAvatar  className="pb-4"/>
                        ) : headerAvatar ? (
                          <AvatarImage src={headerAvatar} alt={headerName} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white font-semibold">
                            {headerName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {onlineUsers.has(otherUserId!) && (
                        <Badge className="absolute -bottom-1 -right-1 w-3 h-3 p-0 bg-green-500 hover:bg-green-500" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
                        {headerName}
                      </h2>
                      {conversationInfo?.title !== "AI-Assistant" &&
                      !conversationInfo?.isGroup ? (
                        <p className="text-xs sm:text-sm text-gray-500">
                          {typingUser === otherUserId
                            ? "typing..."
                            : onlineUsers.has(otherUserId!)
                            ? "Online"
                            : "Offline"}
                        </p>
                      ) : conversationInfo?.isGroup ? (
                        <p className="text-xs sm:text-sm text-gray-500">
                          {conversationInfo.participants.map((p) => p.user.firstName).join(", ")}
                        </p>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            </div>

            {conversationInfo?.title === "AI-Assistant" &&
              !conversationInfo.isGroup && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDeleteOpen(true)}
                  className="hover:bg-red-100 hover:text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
          </div>
        </div>
      </div>

      {/* Pinned Message */}
      {pinnedMessage && (
        <div className="mx-4 mt-4 py-4 rounded-lg shadow-md border-l-4 sticky top-[75px] z-10 border-l-yellow-400 bg-yellow-50">
          <div
            className="cursor-pointer transition-colors"
            onClick={() => {
              const msg = messages.find((m) => m.id === pinnedMessage.id);
              if (msg) {
                const el = document.getElementById(`msg-${msg.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }
            }}
          >
            <div className="flex items-center gap-4 pl-5">
              <PinIcon className="h-4 w-4 text-yellow-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">
                  {pinnedMessage.content || "Pinned message"}
                </p>
                <p className="text-xs text-gray-500">
                  Pinned by {pinnedMessage.sender?.firstName}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 pb-32 h-full overflow-y-auto">
          <div className="space-y-4 mt-4">
            {loadingInfo ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`flex ${
                      i % 2 === 0 ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`flex ${
                        i % 2 === 0 ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div className="max-w-sm px-3 py-2 rounded-xl bg-gray-200 animate-pulse space-y-2">
                        <div className="h-3 bg-gray-300 rounded w-24" />
                        <div className="h-3 bg-gray-300 rounded w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <Card className="max-w-md w-full">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-100 mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      Start the conversation
                    </h3>
                    <p className="text-gray-600">
                      Send your first message to get started!
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              messages.map((message) => {
                const isStreaming = message.temp;
                if (userId === message?.sender?.clerkId) {
                  return (
                    <div
                      id={`msg-${message.id}`}
                      className="flex flex-row-reverse gap-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        {conversationInfo?.isGroup && (
                          <div className="flex justify-end items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-800">
                              You
                            </span>
                          </div>
                        )}

                        <div className="bg-purple-400 rounded-2xl px-4 py-3 shadow-sm border border-purple-100 group-hover:shadow-md transition-shadow max-w-fit ml-auto relative">
                          {editMessageId === message.id ? (
                            <div className="space-y-3">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[60px] resize-none text-white"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditMessageId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    handleEditMessage(message.id);
                                    fetchPinnedMessage();
                                    setEditMessageId(null);
                                  }}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {message.id === message.id &&
                                message.imageUrl === null &&
                                message.audioUrl === null &&
                                !conversationInfo?.pairKey?.startsWith("ai") &&
                                !message?.content?.startsWith("@AI") && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6 opacity-0 cursor-pointer group-hover:opacity-100 hover:bg-white/20"
                                      >
                                        <MoreVertical className="h-4 w-4 text-white" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setEditMessageId(message.id);
                                          setEditContent(message.content ?? "");
                                        }}
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDelete(message.id)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                      {pinnedMessage?.id === message.id ? (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleUnpinMessage(message.id)
                                          }
                                        >
                                          <PinOff className="h-4 w-4 mr-2" />
                                          Unpin
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handlePinMessage(message.id)
                                          }
                                        >
                                          <Pin className="h-4 w-4 mr-2" />
                                          Pin
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}

                              <div className="text-white flex flex-col text-end prose prose-sm max-w-none leading-relaxed">
                                <p className="leading-relaxed mr-3">
                                  {message.content}
                                </p>
                                {/* Audio message */}
                                {/* {message.audioUrl && (
                                <div className="mt-2">
                                  <audio
                                    controls
                                    src={message.audioUrl}
                                    className="w-full max-w-[250px] rounded-lg"
                                  />
                                </div>
                              )} */}
                                <div className="flex justify-end mt-1">
                                  <span className="text-xs text-slate-300">
                                    {new Date(
                                      message.createdAt
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}

                          {message.imageUrl && (
                            <div className="mt-3">
                              <img
                                src={message.imageUrl}
                                alt="Shared image"
                                className="w-full max-w-[250px] sm:max-w-[350px] md:max-w-[450px] lg:max-w-[550px] rounded-xl border border-purple-100 shadow-sm object-cover"
                              />
                            </div>
                          )}
                          {message.audioUrl && (
                            <div className="mt-2">
                              <AudioMessage src={message.audioUrl} />
                            </div>
                          )}

                          {/* Dropdown modal */}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div
                      className="flex justify-start gap-1 group"
                      id={`msg-${message.id}`}
                    >
                      {conversationInfo?.isGroup && !message.isAi && (
                        <Avatar className="w-6 h-6 border border-purple-200">
                          {message?.sender?.imageUrl ? (
                            <AvatarImage
                              src={message?.sender?.imageUrl}
                              alt={
                                message?.sender
                                  ? `${message.sender.firstName}`
                                  : "User"
                              }
                            />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white font-semibold">
                              {message?.sender?.firstName
                                ? message.sender.firstName
                                    .charAt(0)
                                    .toUpperCase()
                                : "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      )}
                      <div
                        className={`rounded-2xl p-[3.5px] w-fit max-w-prose group-hover:shadow-md transition-shadow
    ${
      message.isAi
        ? aiConversationPairKey?.startsWith("ai")
          ? "bg-white shadow-sm border border-purple-100 ml-0 mr-auto"
          : "bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 mx-auto bg-[length:200%_200%] animate-gradientMove"
        : "bg-white shadow-sm border border-purple-100 mr-auto"
    }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-3 bg-white w-full 
    overflow-x-auto max-w-[80vw] sm:max-w-[95vw] md:max-w-[60vw] lg:max-w-[50vw]
    break-words 
    [-webkit-overflow-scrolling:touch] 
    ${
      message.isAi && !aiConversationPairKey?.startsWith("ai")
        ? "text-gray-900"
        : "text-gray-800"
    }`}
                        >
                          {conversationInfo?.isGroup && !message.isAi && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-800">
                                {message?.sender
                                  ? `${
                                      message.sender.firstName ?? ""
                                    }`.trim() || message.sender.clerkId
                                  : "Unknown User"}
                              </span>
                            </div>
                          )}
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content || ""}
                          </ReactMarkdown>

                          {message.imageUrl && (
                            <div className="mt-3">
                              <img
                                src={message.imageUrl}
                                alt="Shared image"
                                className="w-full max-w-[250px] sm:max-w-[350px] md:max-w-[450px] lg:max-w-[550px] rounded-lg border border-purple-100 shadow-sm object-contain"
                              />
                            </div>
                          )}
                          {message.audioUrl && (
                            <div className="mt-2">
                              <AudioMessage src={message.audioUrl} />
                            </div>
                          )}
                          {!isStreaming && (
                            <span className="text-xs text-gray-500 whitespace-nowrap mt-2 flex justify-end">
                              {new Date(message.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <Card className="fixed bottom-0 py-3 left-0 right-0 rounded-none border-x-0 border-b-0 shadow-lg">
        <CardContent className="p-4">
          <div className="max-w-4xl mx-auto">
            {text.includes("@AI") && (
              <Card className="mb-4 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 p-0.5">
                <CardContent className="bg-white rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 flex items-center justify-center rounded-full overflow-hidden">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-pulse" />
                      <Sparkles className="relative z-10 h-4 w-4 text-white" />
                    </div>
                    <span className="text-purple-600 font-medium text-sm">
                      <span className="font-semibold">AI Assistant</span> - Ask
                      anything
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-end gap-3">
              {conversationInfo && !aiConversationPairKey?.startsWith("ai") && (
                <Button
                  variant={recording ? "destructive" : "outline"}
                  size="icon"
                  onClick={recording ? stopRecording : startRecording}
                  className="flex-shrink-0 text-purple-500 hover:bg-purple-600 hover:text-white cursor-pointer"
                >
                  {recording ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}

              {previewAudio ? (
                <div className="flex-1">
                  <AudioMessage
                    src={previewAudio}
                    preview
                    onSend={sendAudioMessage}
                    sending={uploadingRecording}
                    onCancel={() => {
                      setPreviewAudio(null);
                      setAudioBlob(null);
                    }}
                  />
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleImageSelect}
                  />

                  {selectedImage && previewUrl ? (
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="h-16 w-16 object-cover rounded-lg border-2 border-purple-200"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => {
                            setSelectedImage(null);
                            setPreviewUrl(null);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {conversationInfo &&
                        !aiConversationPairKey?.startsWith("ai") && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-shrink-0 text-purple-500 hover:bg-purple-600 hover:text-white cursor-pointer"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        )}
                      <div className="flex-1 -mb-2 relative">
                        <TextareaAutosize
                          value={text}
                          onChange={(e) => {
                            setText(e.target.value);
                            emitTyping();
                          }}
                          onKeyDown={handleKeyPress}
                          minRows={1}
                          maxRows={6}
                          placeholder="Type a message..."
                          className="w-full px-4 py-3 pr-12 text-sm rounded-lg border border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400 focus:ring-opacity-20 bg-white resize-none outline-none"
                        />
                      </div>
                    </>
                  )}
                  <Button
                    onClick={handleSend}
                    disabled={
                      (!text.trim() && !selectedImage) ||
                      !connected ||
                      aiStreaming ||
                      imageUploading
                    }
                    size="icon"
                    className="flex-shrink-0 bg-purple-600 hover:bg-purple-700"
                  >
                    {aiStreaming || imageUploading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteChat}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
