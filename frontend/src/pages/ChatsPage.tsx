import { useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, MessageCircle, Users, Copy } from "lucide-react";
import CreateGroupModal from "@/components/CreateGroupModal"; // new component we'll create
import { useNavigate } from "react-router-dom";
import InviteModal from "@/components/InviteModal";

type DBUser = {
  id: string;
  clerkId: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
};

type ParticipantWithUser = {
  id: string;
  userId: string;
  conversationId: string;
  joinedAt: string;
  user: {
    id: string;
    clerkId: string;
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
  };
};

type Conversation = {
  id: string;
  title?: string | null;
  pairKey?: string | null;
  isGroup: boolean;
  createdAt: string;
  participants: ParticipantWithUser[];
};

export default function ChatsPage() {
  const { getToken } = useAuth();
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [conversations, setConversations] = useState<Conversation[] | null>(
    null
  );
  const [inviteLoading, setInviteLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteData, setInviteData] = useState<{
    token: string;
    url: string;
    expiresAt: string;
  } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const handleGenerateInvite = async () => {
    try {
      setInviteLoading(true);
      const token = await getToken({ template: "default" });
      const res = await axios.post(
        "http://localhost:3000/chat/invite",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const invite = res.data?.invite;
      if (!invite) throw new Error("Invalid response from server");
      setInviteData({
        token: invite.token,
        url: invite.url,
        expiresAt: invite.expiresAt,
      });
      setShowInviteModal(true);
    } catch (err) {
      console.error("Error generating invite link:", err);
      alert(err ?? "Failed to generate invite link.");
    } finally {
      setInviteLoading(false);
    }
  };

  // compute eligible users: unique list of other participants from non-group convs
  const eligibleUsers: {
    id: string;
    clerkId: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
  }[] = (() => {
    if (!conversations || !dbUser) return [];
    const map = new Map<
      string,
      {
        id: string;
        clerkId: string;
        firstName?: string | null;
        lastName?: string | null;
        imageUrl?: string | null;
      }
    >();
    for (const conv of conversations) {
      if (conv.isGroup) continue;
      const other = conv.participants.find((p) => p.user.id !== dbUser.id);
      if (other && !map.has(other.user.clerkId)) {
        map.set(other.user.clerkId, {
          id: other.user.id,
          clerkId: other.user.clerkId,
          firstName: other.user.firstName,
          lastName: other.user.lastName,
          imageUrl: other.user.imageUrl,
        });
      }
    }
    return Array.from(map.values());
  })();

  // Fetch DB user (authorized)
  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const token = await getToken({ template: "default" });
        const res = await fetch("http://localhost:3000/auth/authorize", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("auth/authorize failed");
        const data = await res.json();
        if (mounted) setDbUser(data);
      } catch (err) {
        console.error("fetchUser error:", err);
      }
    };
    fetchUser();
    return () => {
      mounted = false;
    };
  }, [getToken]);

  useEffect(() => {
    let mounted = true;
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const token = await getToken({ template: "default" });
        const res = await fetch("http://localhost:3000/chat/conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("fetch conversations failed");
        const data: Conversation[] = await res.json();
        if (mounted) setConversations(data);
      } catch (err) {
        console.error("fetchConversations error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (dbUser) fetchConversations();
    return () => {
      mounted = false;
    };
  }, [getToken, dbUser]);

  const getOtherParticipant = (conv: Conversation) => {
    if (!dbUser) return null;
    if (conv.isGroup) return null;
    const other = conv.participants.find((p) => p.user.id !== dbUser.id);
    return other ?? null;
  };

  const handleInviteLink = async () => {
    setInviteLoading(true);
    try {
      const token = await getToken({ template: "default" });
      const res = await axios.post(
        "http://localhost:3000/chat/invite",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Invite link generated:", res.data);
      // copying to clipboard
      await navigator.clipboard.writeText(res.data.invite.url);
      alert("Invite link copied to clipboard");
    } catch (error) {
      console.error("Error generating invite link:", error);
      alert("Failed to generate invite link.");
    } finally {
      setInviteLoading(false);
    }
  };

  if (!dbUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">Loading user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Your Chats</h1>
              <p className="text-purple-100">
                Stay connected with your conversations
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <MessageCircle className="h-8 w-8 text-purple-200" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Action Bar */}
        {/* Action Bar */}
        <Card className="mb-8 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Start a new conversation
                </h2>
                <p className="text-gray-600 text-sm">
                  Generate an invite link to connect with others or create a
                  group from people you've chatted with
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleGenerateInvite}
                  disabled={inviteLoading}
                  className="bg-gradient-to-r cursor-pointer from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  {inviteLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Generate Invite Link
                </Button>

                <Button
                  onClick={() => setShowCreateModal(true)}
                  variant="ghost"
                  className="flex items-center gap-2 border cursor-pointer rounded px-3 py-2 hover:bg-purple-50 hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Plus className="h-4 w-4 text-purple-600" />
                  Create Group
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {showCreateModal && (
          <CreateGroupModal
            onClose={() => setShowCreateModal(false)}
            eligibleUsers={eligibleUsers}
            onCreated={(convId: string) => {
              setShowCreateModal(false);
              // navigate to conversation page
              navigate(`/conversation/${convId}`);
            }}
          />
        )}
        {showInviteModal && inviteData && (
          <InviteModal
            invite={inviteData}
            onClose={() => {
              setShowInviteModal(false);
              setInviteData(null);
            }}
            currentUser={dbUser}
          />
        )}

        {/* Conversations Section */}
        <div>
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Recent Conversations
            </h2>
            <div className="ml-auto flex items-center text-sm text-gray-500">
              {conversations && conversations.length > 0 && (
                <span>
                  {conversations.length} conversation
                  {conversations.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {loading && (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && (!conversations || conversations.length === 0) && (
            <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <MessageCircle className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No conversations yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start your first conversation by generating an invite link
                </p>
                <Button
                  onClick={handleInviteLink}
                  variant="hero"
                  className="bg-gradient-to-r from-purple-500 to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Chat
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {conversations?.map((conv) => {
              const other = getOtherParticipant(conv);
              const displayName = conv.isGroup
                ? conv.title ?? "Unnamed group"
                : other
                ? `${other.user.firstName ?? "Unknown"}${
                    other.user.lastName ? ` ${other.user.lastName}` : ""
                  }`
                : "Unknown";

              const avatarUrl = conv.isGroup
                ? undefined
                : other?.user.imageUrl ?? undefined;

              return (
                <Card
                  key={conv.id}
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:bg-white/90"
                  onClick={() => {
                    window.location.href = `/conversation/${conv.id}`;
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-14 h-14 border-2 border-purple-200 shadow-lg">
                          {" "}
                          <AvatarImage src={avatarUrl} alt={displayName} />{" "}
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white font-semibold text-lg">
                            {" "}
                            {(displayName || "U")
                              .slice(0, 1)
                              .toUpperCase()}{" "}
                          </AvatarFallback>{" "}
                        </Avatar>
                        {conv.isGroup && (
                          <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1">
                            <Users className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-gray-900 truncate text-lg">
                            {displayName}
                          </h3>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {new Date(conv.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate">
                            {conv.isGroup
                              ? `Group chat • ${conv.participants.length} members`
                              : `Private conversation`}
                          </p>
                          <div className="ml-2 text-purple-400">
                            <MessageCircle className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
