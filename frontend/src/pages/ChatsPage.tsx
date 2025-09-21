import { useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  MessageCircle,
  Users,
  Link,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InviteModal } from "@/components/InviteModal";
import AiConversationAvatar from "@/components/AiConversationAvatar";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { CreateGroupModal } from "@/components/CreateGroupModal";

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
  user: DBUser;
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
  const [activeTab, setActiveTab] = useState<"people" | "groups">("people");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleGenerateInvite = async () => {
    try {
      setInviteLoading(true);
      const token = await getToken({ template: "default" });
      const baseUrl =
        import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
      const res = await axios.post(
        `${baseUrl}/chat/invite`,
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

  // compute eligible users
  const eligibleUsers: DBUser[] = (() => {
    if (!conversations || !dbUser) return [];
    const map = new Map<string, DBUser>();
    for (const conv of conversations) {
      if (conv.isGroup) continue;
      const other = conv.participants.find((p) => p.user.id !== dbUser.id);
      if (other && !map.has(other.user.clerkId) && other.user.clerkId !== "ai_bot") {
        map.set(other.user.clerkId, other.user);
      }
    }
    return Array.from(map.values());
  })();

  // Fetch DB user
  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const token = await getToken({ template: "default" });
        const baseUrl =
          import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/auth/authorize`, {
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
        const baseUrl =
          import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/chat/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("fetch conversations failed");
        const data: {
          conversations: Conversation[];
          conversationPairKeys: { pairKey: string; id: string }[];
        } = await res.json();
        if (mounted) {
          setConversations(data?.conversations);
        }
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

  const filteredConversations = conversations?.filter((conv) => {
    const matchesTab = activeTab === "people" ? !conv.isGroup : conv.isGroup;
    if (!matchesTab) return false;

    if (!searchQuery.trim()) return true;

    const other = getOtherParticipant(conv);
    const displayName = conv.isGroup
      ? conv.title ?? "Unnamed group"
      : other
      ? `${other.user.firstName ?? ""} ${other.user.lastName ?? ""}`.trim()
      : "Unknown";

    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!dbUser) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center pt-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-purple-600 font-medium">
              Loading your chats...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white pt-16">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2">Your Conversations</h1>
              <p className="text-purple-100 text-lg">
                Stay connected with the people that matter
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <Link className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Start New Chat
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Generate an invite link to connect
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleGenerateInvite}
                  disabled={inviteLoading}
                  className="w-full cursor-pointer bg-purple-500 hover:bg-purple-600 text-white"
                >
                  {inviteLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Link className="h-4 w-4 mr-2" />
                  )}
                  Generate Invite Link
                </Button>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Create Group
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Bring people together in a group
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  disabled={eligibleUsers.length === 0}
                  variant="outline"
                  className="w-full cursor-pointer"
                >
                 <span className="text-purple-600 flex items-center justify-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group Chat
                  </span> 
                </Button>
              </CardContent>
            </Card>
          </div>
          <Card className="p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>
          <div className="flex justify-center mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={activeTab === "people" ? "secondary" : "ghost"}
                onClick={() => setActiveTab("people")}
                className={`px-6 py-2 rounded-md font-medium text-sm cursor-pointer ${activeTab === "people" ? "bg-white text-purple-500 shadow" : ""
                  }`}
              >
                <MessageCircle className="h-4 w-4 mr-2 inline" />
                People
              </Button>
              <Button
                variant={activeTab === "groups" ? "secondary" : "ghost"}
                onClick={() => setActiveTab("groups")}
                className={`px-6 py-2 rounded-md font-medium text-sm cursor-pointer ${activeTab === "groups" ? "bg-white text-purple-500 shadow" : ""}`}
              >
                <Users className="h-4 w-4 mr-2 inline" />
                Groups
              </Button>
            </div>
          </div>
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredConversations?.map((conv) => {
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
                  onClick={() => navigate(`/conversation/${conv.id}`)}
                  className="p-6 hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {conv.title === "AI-Assistant" && !conv.isGroup ? (
                        <AiConversationAvatar className="h-12 w-12" />
                      ) : (
                        <Avatar className="w-12 h-12">
                          {avatarUrl ? (
                            <AvatarImage src={avatarUrl} />
                          ) : (
                            <AvatarFallback>
                              {(displayName || "U")
                                .slice(0, 1)
                                .toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      )}
                      {conv.isGroup && (
                        <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1">
                          <Users className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {displayName}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {new Date(conv.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conv.isGroup
                          ? `${conv.participants.length} members`
                          : "Private chat"}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
      <CreateGroupModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        eligibleUsers={eligibleUsers}
        onCreated={(convId: string) => {
          setShowCreateModal(false);
          // console.log("CONVid TO navigate:", convId);
          if(convId)   navigate(`/conversation/${convId}`);
        }}
      />

      {inviteData && (
        <InviteModal
          open={showInviteModal}
          invite={inviteData}
          onClose={() => {
            setShowInviteModal(false);
            setInviteData(null);
          }}
        />
      )}
    </>
  );
}
