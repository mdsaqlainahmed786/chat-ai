// src/components/Conversation.tsx
import { useState } from "react";
import { useConversationSocket } from "../hooks/useConversation";
import { useParams } from "react-router-dom";
export default function Conversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { connected, messages, sendMessage } = useConversationSocket(conversationId);
  const [text, setText] = useState("");

  if (!conversationId) {
    return <div>No conversation ID provided in URL.</div>;
  }
  const handleSend = async () => {
    if (!text.trim()) return;
    await sendMessage({ content: text });
    setText("");
  };

  return (
    <div>
      <div>Connected: {connected ? "yes" : "no"}</div>
      <div style={{ maxHeight: 400, overflow: "auto" }}>
        {messages.map((m) => (
          <div key={m.id}>
            <strong>{m.sender.firstName ?? m.sender.clerkId}</strong>: {m.content}
            {m.imageUrl && <img src={m.imageUrl} alt="img" style={{ width: 120 }} />}
          </div>
        ))}
      </div>

      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
