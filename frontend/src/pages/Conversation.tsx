import { useState, useRef, useEffect } from "react";
import { useConversationSocket } from "../hooks/useConversation";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/clerk-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Users, Circle } from "lucide-react";

export default function Conversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { connected, messages, sendMessage } =
    useConversationSocket(conversationId);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userId } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    console.log("USERid:", userId);
  }, [messages]);

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

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendMessage({ content: text });
    setText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
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
                className="hover:bg-purple-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Chat Room</h2>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Circle
                      className={`h-2 w-2 ${
                        connected
                          ? "fill-green-500 text-green-500"
                          : "fill-gray-400 text-gray-400"
                      }`}
                    />
                    {connected ? "Connected" : "Connecting..."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="max-w-4xl mx-auto px-4 pb-32">
        <div className="py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-16">
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
          ) : (
            messages.map((message) => {
              console.log("Message:", message.sender.clerkId);
              if (userId === message.sender.clerkId) {
                return (
                  <div
                    key={message.id}
                    className="flex flex-row-reverse gap-3 group"
                  >
                    <div className="flex-shrink-0">
                      {
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={message.sender.imageUrl || undefined}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white text-sm">
                            {(
                              message.sender.firstName?.[0] ||
                              message.sender.clerkId![0] ||
                              "U"
                            ).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      }
                    </div>

                    <div className="flex-1 min-w-0 -mx-2">
                      {
                        <div className="flex justify-end items-center gap-2 mb-1">
                          <span className="font-medium text-gray-800 text-sm">
                            {message.sender.firstName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      }

                      <div className="bg-purple-400 rounded-2xl px-4 py-3 shadow-sm border border-purple-100 group-hover:shadow-md transition-shadow">
                        <p className="text-white leading-relaxed">
                          {message.content}
                        </p>
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
                  <div key={message.id} className="flex gap-3 group">
                    <div className="flex-shrink-0">
                      {
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={message.sender.imageUrl || undefined}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white text-sm">
                            {(
                              message.sender.firstName?.[0] ||
                              message.sender.clerkId![0] ||
                              "U"
                            ).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      {
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-800 text-sm">
                            {message.sender.firstName || message.sender.clerkId}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      }

                      <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-purple-100 group-hover:shadow-md transition-shadow">
                        <p className="text-gray-800 leading-relaxed">
                          {message.content}
                        </p>
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
            <Button
              onClick={handleSend}
              disabled={!text.trim() || !connected}
              size="icon"
              className="h-12 w-12 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
