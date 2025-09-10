import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager",
      company: "TechFlow Inc.",
      content: "AIChat Pro has revolutionized how our team collaborates. The @AI feature gives us instant insights that would take hours to research manually.",
      rating: 5,
      avatar: "SC"
    },
    {
      name: "Michael Rodriguez",
      role: "Engineering Lead",
      company: "DataStream",
      content: "The real-time AI responses are incredibly accurate. It's like having a senior expert in every conversation helping solve complex problems.",
      rating: 5,
      avatar: "MR"
    },
    {
      name: "Emily Watson",
      role: "Marketing Director",
      company: "GrowthLab",
      content: "Our team productivity increased by 40% since using AIChat Pro. The AI understands context perfectly and provides relevant suggestions.",
      rating: 5,
      avatar: "EW"
    },
    {
      name: "David Kim",
      role: "Startup Founder",
      company: "InnovateCo",
      content: "As a small team, having AI assistance in our daily conversations is like adding a world-class consultant to every discussion.",
      rating: 5,
      avatar: "DK"
    },
    {
      name: "Lisa Thompson",
      role: "Operations Manager",
      company: "ScaleUp Solutions",
      content: "The multi-language support is phenomenal. Our global team can now communicate seamlessly with AI helping bridge any gaps.",
      rating: 5,
      avatar: "LT"
    },
    {
      name: "Alex Foster",
      role: "Creative Director",
      company: "DesignStudio",
      content: "AIChat Pro sparks creativity in ways I never expected. The AI suggestions often lead us to breakthrough ideas we wouldn't have found alone.",
      rating: 5,
      avatar: "AF"
    }
  ];

  return (
    <section id="testimonials" className="py-24 bg-gradient-to-b from-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-500 mb-6">
            <span className="text-sm font-medium">Testimonials</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Loved by Teams
            <span className="bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent"> Worldwide</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of teams who have transformed their communication with AI-powered conversations.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group relative p-8 bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-8 h-8 text-purple-500" />
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                  <span className="text-purple-700 font-semibold text-sm">
                    {testimonial.avatar}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 border-t border-purple-200">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-purple-500 mb-2">10,000+</div>
            <div className="text-gray-600">Active Teams</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-purple-500 mb-2">500M+</div>
            <div className="text-gray-600">AI Responses</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-purple-500 mb-2">99.9%</div>
            <div className="text-gray-600">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-purple-500 mb-2">4.9★</div>
            <div className="text-gray-600">User Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;