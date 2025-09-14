import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import { SignedIn, SignedOut, SignIn, SignUp } from "@clerk/clerk-react";
import ChatsPage from "./pages/ChatsPage";
import Conversation from "./pages/Conversation";
import Joining from "./pages/Joining";

const queryClient = new QueryClient();

const App = () => (
  <div className="bg-background text-foreground">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/signup"
            element={<SignUp signInUrl="/signin" afterSignUpUrl="/chats" />}
          />

          <Route
            path="/signin"
            element={<SignIn signUpUrl="/signup" afterSignInUrl="/chats" />}
          />
          <Route path="/conversation/:conversationId" element={<Conversation  />} />
          <Route path="/join/:clerkId" element={<Joining />} />
          <Route
            path="/chats"
            element={
              <>
                <SignedIn>
                  <ChatsPage />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/signin" />
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
