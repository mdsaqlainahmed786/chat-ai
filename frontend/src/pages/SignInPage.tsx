import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { SignIn } from "@clerk/clerk-react";

function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <Navbar />
      <div className="flex-grow py-32 flex items-center justify-center px-4">
        <SignIn signUpUrl="/signup" afterSignInUrl="/chats" />
      </div>
      <Footer />
    </div>
  );
}

export default SignInPage;
