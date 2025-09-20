import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircleIcon } from "lucide-react"
import { 
  MessageCircle, 
  Users, 
  AlertCircle, 
  Home, 
  CheckCircle,
  Loader2
} from "lucide-react";

const Navbar = () => (
  <nav className="bg-white border-b border-purple-100 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center">
          <MessageCircle className="h-8 w-8 text-purple-600 mr-2" />
          <span className="text-xl font-semibold text-gray-900">ChatApp</span>
        </div>
      </div>
    </div>
  </nav>
);

function Joining() {
  const { clerkId } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const joinConversation = async () => {
      if (!clerkId) {
        setError("Invalid invitation link. No user ID found.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const baseUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
        const token = await getToken({ template: "default" });
        
        if (!token) {
          setError("Authentication failed. Please sign in and try again.");
          setLoading(false);
          navigate("/signin");
          return;
        }

        const response = await axios.post(
          `${baseUrl}/chat/create-with`,
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
          setSuccess(true);
          setTimeout(() => {
            navigate(`/conversation/${response.data.conversationId}`);
          }, 1000);
        } else {
          setError("Failed to create conversation. Please try again.");
        }
      } catch (error: unknown) {
        console.error("Error joining conversation:", error);

        if (error instanceof AxiosError) {
          if (error.response?.status === 404) {
            setError("User not found. The invitation link may be invalid or expired.");
          } else if (error.response?.status === 401) {
            setError("Authentication failed. Please sign in and try again.");
          } else if (error.response?.status === 409) {
            setError("Conversation already exists with this user.");
          } else if (error.response?.data?.message) {
            setError(error.response.data.message);
          } else {
            setError("Something went wrong while joining the conversation. Please try again.");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    joinConversation();
  }, [clerkId, getToken, navigate]);

  const handleGoHome = () => {
    navigate("/chats");
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <Navbar />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <Card className="w-full max-w-md shadow-lg border-purple-100">
          <CardContent className="p-8">
            <div className="text-center">
              {loading && !error && (
                <>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 mx-auto mb-6 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Joining Conversation
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Please wait while we connect you...
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-purple-600">
                    <Users className="h-4 w-4" />
                    <span>Setting up your chat</span>
                  </div>
                </>
              )}

              {success && conversationId && (
                <>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 mx-auto mb-6 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Success!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Conversation created successfully. Redirecting you now...
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                    <MessageCircle className="h-4 w-4" />
                    <span>Opening conversation</span>
                  </div>
                </>
              )}

              {error && (
                <>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-red-200 mx-auto mb-6 flex items-center justify-center">
                    <AlertCircleIcon className="h-8 w-8 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Something went wrong
                  </h2>
                  
                  <div className="mb-6 flex items-center gap-2 border-red-200 bg-red-50 w-full">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <div className="text-red-800 text-sm text-left">
                      {error}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      onClick={handleRetry}
                      className="w-full bg-purple-600 cursor-pointer hover:bg-purple-700"
                    >
                      <Loader2 className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                    
                    <Button 
                      onClick={handleGoHome}
                      variant="outline"
                      className="w-full cursor-pointer border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Go to Home
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Joining;