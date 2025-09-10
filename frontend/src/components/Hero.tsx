import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-white overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-10">
        <img
          src={heroImage}
          alt="AI Chat Interface"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-white opacity-90"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl animate-pulse delay-1000"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-purple-700 mb-8 mt-27">
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Powered by Gemini 2.0</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your
            <span className="bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent block">
              Team Chat
            </span>
            with AI Magic
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
            Simply type{" "}
            <span className="font-mono bg-purple-100 px-2 py-1 rounded text-purple-700">
              @AI
            </span>{" "}
            in any conversation and watch as Gemini 2.0 instantly provides
            intelligent responses that both participants can see in real-time.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              className="px-8 text-lg py-3 rounded-xl font-semibold text-white 
  bg-gradient-to-r from-purple-500 to-purple-700 
  shadow-md hover:shadow-lg transition-transform duration-300 
  hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Start Free Trial {<ArrowRight className="w-4 h-4" />}
            </button>

            <Button variant="premium" size="lg" className="text-lg text-purple-700 px-8 py-6 border border-purple-600/20 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-purple-300 flex items-center gap-2">
              <MessageCircle className="mr-2 w-5 h-5" />
              See Demo
            </Button>
          </div>

          {/* Social Proof */}
        </div>
      </div>
    </section>
  );
};

export default Hero;
