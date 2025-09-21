import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { DBUser } from "@/types/db";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";

type DBUser = {
  id: string;
  clerkId: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
};


export const CreateGroupModal = ({
  open,
  onClose,
  eligibleUsers,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  eligibleUsers: DBUser[];
  onCreated: (convId: string) => void;
}) => {
  const { getToken } = useAuth();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!groupTitle.trim() || selectedUsers.length === 0) return;

    setLoading(true);
    try {
      const token = await getToken({ template: "default" });
      const baseUrl =
        import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
      const res = await axios.post(
        `${baseUrl}/chat/create-group`,
        {
          title: groupTitle,
          ExistingMemberClerkIds: selectedUsers,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.conversation.id) onCreated(res.data.conversation.id);
      
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Group Name</Label>
            <Input
              type="text"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="Enter group name..."
            />
          </div>

          <div>
            <Label>Add Members</Label>
            <div className="max-h-48 overflow-y-auto space-y-2 mt-2">
              {eligibleUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center p-2 rounded hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.clerkId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.clerkId]);
                      } else {
                        setSelectedUsers(
                          selectedUsers.filter((id) => id !== user.clerkId)
                        );
                      }
                    }}
                    className="mr-3"
                  />
                  <Avatar className="h-8 w-8 mr-3">
                    {user.imageUrl ? (
                      <AvatarImage src={user.imageUrl} />
                    ) : (
                      <AvatarFallback>
                        {(user.firstName || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-sm">
                    {user.firstName} {user.lastName}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-purple-500 hover:bg-purple-600 text-white flex items-center cursor-pointer"
            disabled={
              loading || !groupTitle.trim() || selectedUsers.length === 0
            }
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            )}
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};