import { UserButton } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import axios from "axios";
function ChatsPage() {
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
    provider: string;
    clerkId: string;
  }
  const [dbUser, setDbUser] = useState<User | null>(null);

  const { getToken } = useAuth();

const generateUniqueInviteLink = async () => {
  try {
    const token = await getToken({ template: "default" }); // fresh token
    const res = await axios.post(
      "http://localhost:3000/chat/invite",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Invite link generated:", res.data);
  } catch (error) {
    console.error("Error generating invite link:", error);
  }
};

  useEffect(() => {
    const fetchUser = async () => {

      const token = await getToken({ template: "default" }); // fresh token
      console.log("TOKEN IN CHATSPAGE>>>>", token)
      const res = await fetch("http://localhost:3000/auth/authorize", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDbUser(data);
    };

    fetchUser();
  }, [getToken]);

  useEffect(() => {
    // fetch all the conversations for this user
    const fetchConversations = async () => {
      const token = await getToken({ template: "default" }); // fresh token
      const res = await fetch("http://localhost:3000/chat/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("User's conversations:", data);
    };
    fetchConversations();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-green-400">Welcome to Chats</h1>
      <UserButton afterSignOutUrl="/signin" />
      {dbUser && <pre>{JSON.stringify(dbUser, null, 2)}</pre>}
      <button onClick={generateUniqueInviteLink} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Generate Invite Link
      </button>
    </div>
  );
}

export default ChatsPage;
