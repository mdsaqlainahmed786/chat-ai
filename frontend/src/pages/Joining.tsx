import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import Navbar from "@/components/Navbar";
function Joining() {
  const { clerkId } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState<string | null>(null);
  useEffect(() => {
    const joinConversation = async () => {
      try {
        const token = await getToken({ template: "default" });
        const response = await axios.post(
          "http://localhost:3000/chat/create-with",
          {
            targetClerkId: clerkId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data.conversationId) {
          setConversationId(response.data.conversationId);
          navigate(`/conversation/${response.data.conversationId}`);
        }
      } catch (error) {
        console.error("Error joining conversation:", error);
      }
    };
    if (clerkId) {
      joinConversation();
    }
  }, [clerkId]);

  return (
    <>
      {conversationId ? (
        <>
          <Navbar />
          <div>Joining conversation {conversationId}...</div>
        </>
      ) : (
        <>
          <Navbar />
          <div>Joining...</div>
        </>
      )}
    </>
  );
}

export default Joining;
