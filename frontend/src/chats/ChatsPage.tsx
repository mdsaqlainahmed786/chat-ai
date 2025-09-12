// src/pages/ChatsPage.tsx
import { UserButton } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import axios from "axios";

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
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Fetch conversations for the current user
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
    // only fetch conversations after we have dbUser (optional but safer)
    if (dbUser) fetchConversations();
    return () => {
      mounted = false;
    };
  }, [getToken, dbUser]);

  // Helper: get the *other* participant (for 1:1). Uses user.id compare.
  const getOtherParticipant = (conv: Conversation) => {
    if (!dbUser) return null;
    if (conv.isGroup) return null;
    const other = conv.participants.find((p) => p.user.id !== dbUser.id);
    return other ?? null;
  };

  if (!dbUser) {
    return (
      <div className="p-4">
        <p>Loading user…</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-green-600">Chats</h1>
        <UserButton afterSignOutUrl="/signin" />
      </div>
      <button
        onClick={async () => {
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
          }
        }}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Generate Invite Link
      </button>

      <div>
        <h2 className="text-lg font-semibold mb-2">Conversations</h2>

        {loading && <div>Loading conversations…</div>}
        {!loading && (!conversations || conversations.length === 0) && <div>No conversations yet.</div>}

        <div className="divide-y">
          {conversations?.map((conv) => {
            // If group show title; otherwise show the other participant
            const other = getOtherParticipant(conv);
            const displayName = conv.isGroup
              ? conv.title ?? "Unnamed group"
              : other ? `${other.user.firstName ?? "Unknown"}${other.user.lastName ? ` ${other.user.lastName}` : ""}` : "Unknown";

            const avatarUrl = conv.isGroup
              ? undefined
              : other?.user.imageUrl ?? undefined;

            return (
              <div
                key={conv.id}
                className="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  window.location.href = `/conversation/${conv.id}`;
                }}
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-600">{(displayName || "U").slice(0, 1)}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className="font-medium truncate">{displayName}</div>
                    <div className="text-xs text-gray-400">{new Date(conv.createdAt).toLocaleTimeString()}</div>
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {/* Optionally show last message preview if you add it to the API */}
                    {conv.isGroup ? `Group • ${conv.participants.length} members` : `1:1 chat`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
