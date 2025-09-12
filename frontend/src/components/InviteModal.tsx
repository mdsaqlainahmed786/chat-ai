// src/components/InviteModal.tsx
import  { useState } from "react";
import { Copy, Share2, X } from "lucide-react";

export default function InviteModal({
  invite,
  onClose,
  currentUser,
}: {
  invite: { token: string; url: string; expiresAt: string };
  onClose: () => void;
  currentUser?: {
    id: string;
    clerkId: string;
    firstName?: string | null;
    imageUrl?: string | null;
    email?: string;
  } | null;
}) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invite.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("copy failed", err);
      alert("Failed to copy. You can select and copy manually.");
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      alert("Native share not available on this device.");
      return;
    }
    try {
      setSharing(true);
      await navigator.share({
        title: `Chat invite from ${currentUser?.firstName ?? "a user"}`,
        text:
          `Hi — I'd like to start a chat with you. Open this link to join:`,
        url: invite.url,
      });
    } catch (err) {
      console.warn("share cancelled or failed", err);
    } finally {
      setSharing(false);
    }
  };

  const formattedExpiry = invite.expiresAt ? new Date(invite.expiresAt).toLocaleString() : "N/A";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold">
              {currentUser?.firstName ? (currentUser.firstName.slice(0,1).toUpperCase()) : (currentUser?.clerkId ?? "U").slice(0,1).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold">Invite link ready</div>
              <div className="text-sm text-gray-500">Share this link with someone you trust</div>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-sm text-gray-700">
            <strong>Important:</strong> Only send this link to someone you trust. When the invitee redeems the link, they will see your name and profile picture and will be able to start a conversation with you. Do not share this link publicly.
          </div>

          <div className="bg-gray-50 p-3 rounded border">
            <div className="text-sm text-gray-500 mb-1">Invite link (expires: {formattedExpiry})</div>
            <div className="flex items-center gap-3">
              <input
                readOnly
                value={invite.url}
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 truncate"
              />
              <button onClick={handleCopy} className="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2">
                <Copy className="w-4 h-4" />
                {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={handleShare} className="px-3 py-1 rounded border" disabled={sharing}>
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-2 rounded border">Close</button>
            <button onClick={handleCopy} className="px-4 py-2 rounded bg-purple-600 text-white" >
              {copied ? "Copied ✓" : "Copy Link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
