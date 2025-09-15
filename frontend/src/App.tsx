import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import ChatsPage from "./pages/ChatsPage";
import Conversation from "./pages/Conversation";
import Joining from "./pages/Joining";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";

const queryClient = new QueryClient();

const App = () => (
  <div className="bg-background text-foreground">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <Routes>
          {/* Landing page → only visible if signed out */}
          <Route
            path="/"
            element={
              <>
                <SignedIn>
                  <Navigate to="/chats" replace />
                </SignedIn>
                <SignedOut>
                  <LandingPage />
                </SignedOut>
              </>
            }
          />

          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/conversation/:conversationId" element={<Conversation />} />
          <Route path="/join/:clerkId" element={<Joining />} />

          {/* Chats → only visible if signed in */}
          <Route
            path="/chats"
            element={
              <>
                <SignedIn>
                  <ChatsPage />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/signin" replace />
                </SignedOut>
              </>
            }
          />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  </div>
);

export default App;
