import { MessageSquare, Users, Zap, Shield, Globe, Brain } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Real-Time AI Integration",
      description: "Simply type @AI and get instant intelligent responses visible to all chat participants."
    },
    {
      icon: Users,
      title: "Collaborative Intelligence",
      description: "Both users see AI responses in real-time, creating a shared intelligent conversation experience."
    },
    {
      icon: Zap,
      title: "Lightning Fast Responses",
      description: "Powered by Gemini 2.0 for instant, contextually aware responses that keep conversations flowing."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and privacy protection for all your sensitive conversations."
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description: "Communicate in over 100 languages with AI that understands context and nuance."
    },
    {
      icon: Brain,
      title: "Contextual Understanding",
      description: "AI remembers conversation history and provides relevant, intelligent responses."
    }
  ];

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-500 mb-6">
            <span className="text-sm font-medium">Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need for
            <span className="bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent"> Smart Conversations</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI-powered chat platform brings intelligence to every conversation, 
            making your team communication more efficient and insightful.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-6 group-hover:bg-purple-200 transition-colors duration-300">
                <feature.icon className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-md rounded-full border border-purple-200">
            <span className="text-sm text-gray-600 mr-2">Ready to experience the future?</span>
            <button className="text-purple-500 font-medium hover:text-purple-700 transition-colors">
              Get started →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;