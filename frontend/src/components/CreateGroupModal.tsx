// src/components/CreateGroupModal.tsx
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

type EligibleUser = {
  id: string;
  clerkId: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
};

export default function CreateGroupModal({
  eligibleUsers,
  onClose,
  onCreated,
}: {
  eligibleUsers: EligibleUser[];
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}) {
  const { getToken } = useAuth();
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // toggle checkbox
  const toggle = (clerkId: string) => {
    setSelected((s) => ({ ...s, [clerkId]: !s[clerkId] }));
  };

  const selectedClerkIds = Object.keys(selected).filter((k) => selected[k]);

  const submit = async () => {
    setError(null);
    if (title.trim().length === 0) {
      setError("Please enter a group name.");
      return;
    }
    if (selectedClerkIds.length < 2) {
      setError("Pick at least 2 users to create a group (group size >= 3 incl. you).");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken({ template: "default" });
      const res = await axios.post(
        "http://localhost:3000/chat/create-group",
        { title, ExistingMemberClerkIds: selectedClerkIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const convId = res.data?.conversation?.id ?? res.data?.conversationId;
      if (!convId) throw new Error("Invalid response from server");
      onCreated(convId);
    } catch (err) {
      console.error("create-group error:", err);
      const msg = err ?? "Failed to create group";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Create Group</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">Close</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Group name</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekend Devs"
              className="w-full border rounded px-3 py-2"
            />
          </label>

          <div>
            <div className="text-sm text-gray-600 mb-2">Select members (you can only pick people you've had 1:1 with)</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-auto pr-2">
              {eligibleUsers.length === 0 && (
                <div className="text-sm text-gray-500">No eligible users found. Have 1:1 conversations first.</div>
              )}

              {eligibleUsers.map((u) => (
                <label key={u.clerkId} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer border">
                  <input
                    type="checkbox"
                    checked={!!selected[u.clerkId]}
                    onChange={() => toggle(u.clerkId)}
                    className="w-4 h-4"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                      {u.imageUrl ? (
                       
                        <Avatar>
                            <AvatarImage src={u.imageUrl} alt={u.firstName ?? u.clerkId} />
                        </Avatar>
                      ) : (
                        <div className="flex items-center justify-center h-full text-sm text-gray-600">{(u.firstName ?? u.clerkId).slice(0,1).toUpperCase()}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{u.firstName ?? u.clerkId}</div>
                      <div className="text-xs text-gray-500">{u.clerkId}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button
              onClick={submit}
              className="px-4 py-2 rounded bg-purple-600 text-white disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
