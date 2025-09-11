// src/components/Conversation.tsx
import React, { useState } from "react";
import { useConversationSocket } from "../hooks/useConversation";

export default function Conversation({ conversationId }: { conversationId: string }) {
  const { connected, messages, sendMessage } = useConversationSocket(conversationId);
  const [text, setText] = useState("");

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
