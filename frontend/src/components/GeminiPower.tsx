import { Button } from "@/components/ui/button";
import { Cpu, Layers, Sparkles, TrendingUp } from "lucide-react";

const GeminiPower = () => {
  const capabilities = [
    {
      icon: Cpu,
      title: "Advanced Reasoning",
      description: "Multi-modal understanding with enhanced logical thinking capabilities",
      stat: "2x faster"
    },
    {
      icon: Layers,
      title: "Context Awareness",
      description: "Maintains conversation context across multiple exchanges",
      stat: "10x more context"
    },
    {
      icon: Sparkles,
      title: "Creative Intelligence",
      description: "Generates creative solutions and innovative ideas",
      stat: "95% accuracy"
    },
    {
      icon: TrendingUp,
      title: "Performance Optimization",
      description: "Continuously learns and improves response quality",
      stat: "99.9% uptime"
    }
  ];

  return (
    <section id="power" className="py-24 bg-gray-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Powered by Gemini 2.0</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            The Most Advanced AI
            <span className="bg-gradient-to-r pb-2 from-purple-400 to-purple-600 bg-clip-text text-transparent block">
              At Your Fingertips
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Harness the power of Google's latest Gemini 2.0 model, designed specifically 
            for real-time conversational AI that understands context, nuance, and intent.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left: Capabilities */}
          <div className="space-y-8">
            {capabilities.map((capability, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all duration-300"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-xl">
                  <capability.icon className="w-6 h-6 text-purple-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {capability.title}
                    </h3>
                    <span className="text-sm font-medium text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full">
                      {capability.stat}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {capability.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Visual Demo */}
          <div className="relative">
            <div className="bg-gradient-to-br from-white/10 to-purple-500/10 p-8 rounded-2xl border border-white/10 shadow-2xl">
              <div className="space-y-4">
                {/* Chat Interface Preview */}
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white/20 rounded-lg p-3 ml-8">
                      <p className="text-white text-sm">Hey, can you help us analyze the Q4 sales data?</p>
                    </div>
                    <div className="bg-purple-500/30 rounded-lg p-3 mr-8">
                      <p className="text-white text-sm">
                        <span className="font-mono text-purple-300">@AI</span> Analyzing Q4 sales data...
                      </p>
                    </div>
                    <div className="bg-purple-500 rounded-lg p-4 mr-8">
                      <p className="text-white text-sm font-medium">✨ AI Response</p>
                      <p className="text-white/90 text-sm mt-1">
                        Based on your Q4 data, I see a 23% increase in sales with peak performance in December. 
                        Would you like me to break down the metrics by region?
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Live indicator */}
                <div className="flex items-center justify-center space-x-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Live AI responses in real-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <Button variant="glass" size="lg" className="text-lg px-8 py-6 bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20">
            Experience Gemini 2.0 Power
            <Sparkles className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GeminiPower;