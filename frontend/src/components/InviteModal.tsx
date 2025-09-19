import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
export const InviteModal = ({
  open,
  invite,
  onClose,
}: {
  open: boolean;
  invite: { token: string; url: string; expiresAt: string };
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invite.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Invite Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-sm text-gray-600 mb-2">Invite Link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-white px-3 py-2 rounded border text-gray-800 break-all">
                {invite.url}
              </code>
              <Button onClick={handleCopy} className="shrink-0 bg-purple-500 hover:bg-purple-600 text-white p-2 cursor-pointer">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="text-center flex items-start gap-2 text-sm text-gray-500">
            {/* <Info className="h-4 w-4 mt-0.5" /> */}
            <span>
              <b>Important:</b> Keep this link safe. It can be used to start a
              conversation with you. Only share it with trusted individuals.
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full bg-purple-500 hover:bg-purple-600 text-white cursor-pointer">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};