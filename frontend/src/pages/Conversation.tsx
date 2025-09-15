import React, { useState, useRef, useEffect } from "react";
import { useConversationSocket } from "../hooks/useConversation";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/clerk-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Send, Users, Circle, Trash2 } from "lucide-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AiConversationAvatar from "@/components/AiConversationAvatar";

export default function Conversation() {
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

  const [conversationInfo, setConversationInfo] =
    useState<ConversationInfo | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const { getToken, userId } = useAuth();
  const [aiConversationPairKey, setAiConversationPairKey] = useState<
    string | null
  >(null);
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { connected, messages, sendMessage, aiStreaming } =
    useConversationSocket(conversationId);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // console.log("MESSAGES", messages);
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
      try {
        const res = await axios.get<ConversationInfo[]>(
          "http://localhost:3000/chat/conversations",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        //@ts-expect-error ignore
        const found = res.data.conversations?.find((c) => c.id === conversationId) ?? null;
        if (!cancelled) {
          setConversationInfo(found);
          setAiConversationPairKey(found?.pairKey ?? null);
          // console.log("Fetched conversation info:", found);
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
      }
    }
  }

  if (!conversationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No conversation selected
          </h2>
          <p className="text-gray-600">
            Please select a conversation to start chatting.
          </p>
          <Button
            onClick={() => navigate("/chats")}
            className="mt-4"
            variant="default"
          >
            Go Back
          </Button>
        </div>
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
      axios
        .post(
          `${
            import.meta.env.VITE_API_BASE || "http://localhost:3000"
          }/ai/message`,
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
    if (!text.trim() || !conversationId) return;
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
      const res = await axios.delete(
        `${
          import.meta.env.VITE_API_BASE || "http://localhost:3000"
        }/ai/delete-chat-history`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { conversationId },
        }
      );
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/chats")}
                className="hover:bg-purple-100 cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex justify-between items-center gap-3">
                {loadingInfo ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
                    </div>
                  </>
                ) : (
                  <>
                    <Avatar className="w-10 h-10 border border-purple-200">
                      {conversationInfo?.title === "AI-Assistant" &&
                      !conversationInfo.isGroup ? (
                        <>
                          <AiConversationAvatar className="pb-4" />
                        </>
                      ) : headerAvatar ? (
                        <AvatarImage src={headerAvatar} alt={headerName} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white font-semibold">
                          {headerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h2 className="font-semibold text-gray-800">
                        {headerName}
                      </h2>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Circle
                          className={`h-2 w-2 ${
                            connected
                              ? "fill-green-500 text-green-500"
                              : "fill-gray-400 text-gray-400"
                          }`}
                        />
                        {connected ? "Online" : "Connecting..."}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            {conversationInfo?.title === "AI-Assistant" &&
              !conversationInfo.isGroup && (
                <div>
                  <button
                    onClick={() => setIsDeleteOpen(true)}
                    className="p-2 rounded-full cursor-pointer hover:bg-gray-100"
                  >
                    <Trash2 className="h-5 w-5 text-gray-500" />
                  </button>
                  <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Delete Conversation</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this chat? This action
                          cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="flex justify-end gap-3">
                        <Button
                          className="cursor-pointer"
                          variant="outline"
                          onClick={() => setIsDeleteOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleDeleteChat}
                          className="bg-red-600 cursor-pointer hover:bg-red-700 text-white flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Chat
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-32">
        <div className="py-6 space-y-4">
          {loadingInfo ? (
            <React.Fragment key={loadingInfo.toString()}>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className={`flex ${
                    i % 2 === 0 ? "justify-start" : "justify-end"
                  } mb-3`}
                >
                  <div
                    className={`h-6 rounded-2xl animate-pulse ${
                      i % 2 === 0
                        ? "bg-gray-200 w-56 h-14"
                        : "bg-purple-200 w-56 h-14"
                    }`}
                  />
                </div>
              ))}
            </React.Fragment>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Start the conversation
                </h3>
                <p className="text-gray-600">
                  Send your first message to get started!
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isStreaming = message.temp;
              if (userId === message?.sender?.clerkId) {
                return (
                  <div
                    key={message.id}
                    className="flex flex-row-reverse gap-3 group"
                  >
                    {/* <div className="flex-shrink-0">
                      {conversationInfo?.isGroup && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={message.sender.imageUrl || undefined}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white text-sm">
                            {(
                              message.sender.firstName?.[0] ||
                              message.sender.clerkId?.[0] ||
                              "U"
                            ).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div> */}
                    <div className="flex-1 min-w-0">
                      {/* {conversationInfo?.isGroup && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-800">
                            {message.sender.firstName
                              ? message.sender.firstName.trim()
                              : message.sender.clerkId}
                          </span>
                        </div>
                      )} */}
                      {conversationInfo?.isGroup && (
                        <div className="flex justify-end items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-800">
                            You
                          </span>
                        </div>
                      )}
                      <div className="bg-purple-400 rounded-2xl px-4 py-3 shadow-sm border border-purple-100 group-hover:shadow-md transition-shadow max-w-fit ml-auto">
                        <div className="text-white flex flex-row justify-end text-end gap-2 prose prose-sm max-w-none leading-relaxed">
                          <p className={`leading-relaxed`}>
                            {" "}
                            {message.content}
                          </p>
                          <div className="flex items-end gap-2 -mb-1 -mr-2">
                            <span className="text-xs text-slate-300">
                              {new Date(message.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                        {message.imageUrl && (
                          <div className="mt-3">
                            <img
                              src={message.imageUrl}
                              alt="Shared image"
                              className="max-w-sm rounded-xl border border-purple-100 shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <React.Fragment key={message.id}>
                    <div className="flex gap-1 group" key={message.id}>
                      {userId !== message?.sender?.clerkId && (
                        <div className="flex">
                          {conversationInfo?.isGroup && !message.isAi && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={message?.sender?.imageUrl || undefined}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white text-sm">
                                {(
                                  message.sender.firstName?.[0] ||
                                  message.sender.clerkId?.[0] ||
                                  "U"
                                ).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      <div
                        className={`bg-white rounded-2xl px-4 py-3 shadow-sm border w-fit max-w-prose border-purple-100 group-hover:shadow-md transition-shadow ${
                          message.isAi
                            ? aiConversationPairKey?.startsWith("ai")
                              ? "ml-0 mr-auto"
                              : "mx-auto"
                            : "mr-auto"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          {conversationInfo?.isGroup && !message.isAi && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-800">
                                {message.sender.firstName
                                  ? message.sender.firstName.trim()
                                  : message.sender.clerkId}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="prose prose-sm text-gray-800 leading-relaxed max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content || ""}
                            </ReactMarkdown>
                          </div>
                          {!isStreaming && (
                            <span className="text-xs text-gray-500 whitespace-nowrap -mb-2">
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
                        {message.imageUrl && (
                          <div className="mt-3">
                            <img
                              src={message.imageUrl}
                              alt="Shared image"
                              className="max-w-sm rounded-xl border border-purple-100 shadow-sm"
                            />
                          </div>
                        )}
                        {isStreaming && (
                          <div className="flex gap-1 mt-2 text-gray-400">
                            <span className="animate-bounce">●</span>
                            <span className="animate-bounce delay-150">●</span>
                            <span className="animate-bounce delay-300">●</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              }
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-purple-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="bg-white border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-2xl px-6 py-3 text-base resize-none"
                disabled={!connected}
              />
            </div>
            {aiStreaming ? (
              <div className="h-12 w-12 rounded-2xl flex justify-center items-center bg-gradient-to-r from-purple-300 to-purple-500 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!text.trim() || !connected}
                size="icon"
                className="h-12 w-12 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Send className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
