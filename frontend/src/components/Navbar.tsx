import { Button } from "@/components/ui/button";
import {
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/clerk-react";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center cursor-pointer"
          >
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent">
                ChatAI
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
              <SignedOut>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a
                href="#features"
                className="text-gray-900 hover:text-purple-500 transition-colors"
              >
                Features
              </a>
              <a
                href="#power"
                className="text-gray-900 hover:text-purple-500 transition-colors"
              >
                AI Power
              </a>
              <a
                href="#testimonials"
                className="text-gray-900 hover:text-purple-500 transition-colors"
              >
                Testimonials
              </a>
              <a
                href="#faq"
                className="text-gray-900 hover:text-purple-500 transition-colors"
              >
                FAQ
              </a>
            </div>
          </div>
          </SignedOut>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-4">
              <SignedOut>
                <div className="flex items-center gap-3">
                 
                    <Button
                      variant="ghost"
                      onClick={() => navigate("/signin")}
                      className="text-gray-900 hover:text-purple-500"
                    >
                      Sign In
                    </Button>
                 
                  <button
                    onClick={() => navigate("/signup")}
                    className="px-4 text-sm py-2 rounded-xl font-semibold text-white 
                     bg-gradient-to-r from-purple-500 to-purple-700 
                     shadow-md hover:shadow-lg transition-transform duration-300 
                     hover:scale-105 active:scale-95"
                  >
                    Get Started
                  </button>
                </div>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center">
                  <UserButton afterSignOutUrl="/signin" />
                </div>
              </SignedIn>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-900 cursor-pointer hover:text-purple-500 transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white/90 backdrop-blur-md rounded-lg mt-2">
              <a
                href="#features"
                className="block px-3 py-2 text-gray-900 hover:text-purple-500 transition-colors"
              >
                Features
              </a>
              <a
                href="#power"
                className="block px-3 py-2 text-gray-900 hover:text-purple-500 transition-colors"
              >
                AI Power
              </a>
              <a
                href="#testimonials"
                className="block px-3 py-2 text-gray-900 hover:text-purple-500 transition-colors"
              >
                Testimonials
              </a>
              <a
                href="#faq"
                className="block px-3 py-2 text-gray-900 hover:text-purple-500 transition-colors"
              >
                FAQ
              </a>
              <div className="-my-1 -mx-1 space-y-2">
                <Button
                  onClick={() => {
                    navigate("/signin");
                  }}
                  className="w-full text-gray-900 cursor-pointer bg-white flex justify-start hover:bg-gray-100 hover:text-purple-500"
                >
                  Sign In
                </Button>
                <button className="px-2 mx-3 mb-2 cursor-pointer text-xs py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-700 shadow-md hover:shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95 flex items-center gap-2">
                  Get Started
                </button>
                <UserButton afterSignOutUrl="/signin" />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
