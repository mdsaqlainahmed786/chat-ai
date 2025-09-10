import { UserButton } from "@clerk/clerk-react";

function ChatsPage() {
  return (
    <div>
      <h1>Welcome to Chats</h1>
      <UserButton afterSignOutUrl="/signin" />
    </div>
  );
}

export default ChatsPage;
