import { UserButton } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
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

  useEffect(() => {
    const fetchUser = async () => {
      const token = await getToken({ template: "default" }); // fresh token
      const res = await fetch("http://localhost:3000/auth/authorize", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDbUser(data);
    };

    fetchUser();
  }, [getToken]);

  return (
    <div>
      <h1>Welcome to Chats</h1>
      <UserButton afterSignOutUrl="/signin" />
      {dbUser && <pre>{JSON.stringify(dbUser, null, 2)}</pre>}
    </div>
  );
}

export default ChatsPage;
