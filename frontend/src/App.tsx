import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import { SignIn } from "@clerk/clerk-react";
import ChatsPage from "./chats/ChatsPage";

const queryClient = new QueryClient();

const App = () => (
  <div className="bg-background text-foreground">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
       
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<div className="p-8">404 Not Found</div>} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/chats" element={<ChatsPage />} />
            <Route path="/signin/*" element={<SignIn />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          </Routes>
        
      </TooltipProvider>
    </QueryClientProvider>
  </div>
);

export default App;