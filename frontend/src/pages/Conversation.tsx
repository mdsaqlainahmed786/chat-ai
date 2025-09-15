import React, { useState, useRef, useEffect } from "react";
import { useConversationSocket } from "../hooks/useConversation";
import { Image as ImageIcon, X, Send, Sparkles } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Users, Trash2 } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
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
        const found =  res.data.conversations?.find((c) => c.id === conversationId) ?? null;
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
    if ((!text.trim() && !selectedImage) || !conversationId) return;

    // if image is selected → upload it
    if (selectedImage) {
      try {
        const token = await getToken({ template: "default" });
        if (!token) return;

        const formData = new FormData();
        formData.append("image", selectedImage);
        formData.append("conversationId", conversationId);
        setImageUploading(true);
        await axios.post(
          `${
            import.meta.env.VITE_API_BASE || "http://localhost:3000"
          }/chat/upload-image`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

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

    // otherwise → normal text message
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
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
                    <div className="flex-1 min-w-0">
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
                              className="w-full max-w-[250px] sm:max-w-[350px] md:max-w-[450px] lg:max-w-[550px] rounded-xl border border-purple-100 shadow-sm object-cover"
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
                        className={`rounded-2xl p-[3.5px] w-fit max-w-prose group-hover:shadow-md transition-shadow
    ${
      message.isAi
        ? aiConversationPairKey?.startsWith("ai")
          ? // ✅ AI conversation -> plain left bubble
            "bg-white shadow-sm border border-purple-100 ml-0 mr-auto"
          : // ✅ Normal convo -> white inside + thicker gradient border
            "bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 mx-auto bg-[length:200%_200%] animate-gradientMove"
        : // ✅ Non-AI -> default
          "bg-white shadow-sm border border-purple-100 mr-auto"
    }`}
                      >
                        {/* Inner box */}
                        <div
                          className={`rounded-2xl overflow-x-auto px-4 py-3 bg-white w-full ${
                            message.isAi &&
                            !aiConversationPairKey?.startsWith("ai")
                              ? "text-gray-900"
                              : "text-gray-800"
                          }`}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content || ""}
                          </ReactMarkdown>
                          {!isStreaming && (
                            <span className="text-xs text-gray-500 whitespace-nowrap -mb-2 flex justify-end">
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
                      {message.imageUrl && (
                        <div className="mt-3">
                          <img
                            src={message.imageUrl}
                            alt="Shared image"
                            className="w-full max-w-[250px] sm:max-w-[350px] md:max-w-[450px] lg:max-w-[550px] rounded-xl border border-purple-100 shadow-sm object-cover"
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
        <div className="max-w-4xl px-4 py-4 flex items-end gap-3 md:mx-auto">
          {/* Hidden file input */}
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
                  className="h-20 w-20 object-cover rounded-lg border"
                />

                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {conversationInfo && !aiConversationPairKey?.startsWith("ai") && (
                <div
                  role="button"
                  className="rounded-2xl hover:bg-purple-100 p-2 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="size-8 text-purple-600" />
                </div>
              )}
              <div className="flex flex-col gap-3 w-full">
                {text.includes("@AI") && (
                  <div className="px-0.5 py-0.5 text-sm bg-purple-50 border border-purple-200 rounded-lg shadow-sm w-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 mx-auto bg-[length:200%_200%] animate-gradientMove">
                    <div
                      className={`px-2 py-3 flex items-center gap-3 md:px-4 rounded-lg bg-white w-full text-gray-900`}
                    >
                      <div
                        className={`relative w-10 h-10 flex items-center justify-center rounded-full overflow-hidden`}
                      >
                        <div
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 
        bg-[length:200%_200%] animate-gradientMove z-10"
                        />
                        <div className="absolute inset-0 rounded-full z-0">
                          <div className="w-full h-full rounded-full bg-purple-500 opacity-40 blur-2xl animate-pulse" />
                        </div>
                        <Sparkles className="relative z-20 h-5 w-5 text-white" />
                      </div>
                      <span className="text-purple-600 font-medium">
                         <span className="font-semibold">AI</span>{" "}
                        Ask any thing to AI assistant
                      </span>
                    </div>
                  </div>
                )}
                

                <div className="relative w-full">
                  <div
                    className="absolute inset-0 px-6 py-3 text-base rounded-2xl border border-purple-200 
      focus-within:border-purple-400 focus-within:ring-purple-400 bg-white 
      whitespace-pre-wrap break-words pointer-events-none w-full overflow-hidden"
                  >
                    {text.split(" ").map((word, i) =>
                      word === "@AI" ? (
                        <span
                          key={i}
                          className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600 font-semibold"
                        >
                          {word + " "}
                        </span>
                      ) : (
                        word + " "
                      )
                    )}
                    {!text && (
                      <span className="text-gray-400 select-none">
                        Type a message...
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                     onKeyDown={handleKeyPress}
                    className="relative w-full px-6 py-3 text-base rounded-2xl border border-purple-200 
      focus:border-purple-400 focus:ring-purple-400 bg-transparent text-transparent caret-black 
      outline-none"
                    autoComplete="off"
                  />
                </div>
           </div>
            </>
          )}
         

          {/* Send button (always visible) */}
          {aiStreaming || imageUploading ? (
            <div className="h-12 w-12 rounded-2xl flex justify-center items-center bg-gradient-to-r from-purple-300 to-purple-500 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Button
              onClick={handleSend}
              disabled={(!text.trim() && !selectedImage) || !connected}
              size="icon"
              className="h-12 w-12 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Send className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
