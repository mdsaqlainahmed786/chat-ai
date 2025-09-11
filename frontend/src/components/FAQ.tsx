import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does the @AI feature work?",
      answer:
        "Simply type '@AI' followed by your question or request in any chat conversation. Our Gemini 2.0 AI will instantly analyze the context and provide intelligent responses that both participants can see in real-time. The AI understands conversation history and provides contextually relevant answers.",
    },
    {
      question: "What makes Gemini 2.0 different from other AI models?",
      answer:
        "Gemini 2.0 offers superior contextual understanding, faster response times, and enhanced reasoning capabilities. It can handle complex conversations, maintain context across multiple exchanges, and provides more accurate and nuanced responses compared to previous AI models.",
    },
    {
      question: "Is my conversation data secure and private?",
      answer:
        "Absolutely. We use bank-level encryption for all conversations and never store personal chat data permanently. Our AI processes conversations in real-time without retaining sensitive information. We're fully compliant with GDPR, SOC 2, and other major privacy standards.",
    },
    {
      question: "What are the different membership tiers?",
      answer:
        "We offer three tiers: Basic (essential AI features for small teams), Standard (advanced features with priority support), and Premium (enterprise-grade with unlimited AI requests, analytics, and custom integrations). Pricing will be announced soon with early-bird discounts for beta users.",
    },
    {
      question: "Can I use ChatAI with my existing team tools?",
      answer:
        "Yes! ChatAI integrates seamlessly with popular platforms like Slack, Microsoft Teams, Discord, and more. You can also use our standalone app or web interface. API access is available for custom integrations with Premium plans.",
    },
    {
      question: "How accurate are the AI responses?",
      answer:
        "Our Gemini 2.0 integration maintains a 95%+ accuracy rate for contextually relevant responses. The AI continuously learns from interactions (while maintaining privacy) and improves its understanding of your team's communication patterns and needs.",
    },
    {
      question: "Is there a free trial available?",
      answer:
        "Yes! We offer a 14-day free trial with full access to all Basic tier features. No credit card required to start. You can invite your team and experience the full power of AI-enhanced conversations before committing to a paid plan.",
    },
    {
      question: "What languages does the AI support?",
      answer:
        "ChatAI supports over 100 languages with native understanding. The AI can seamlessly switch between languages within the same conversation and even help translate or clarify communications between team members speaking different languages.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-500 mb-6">
            <HelpCircle className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">FAQ</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked
            <span className="bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent">
              {" "}
              Questions
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about ChatAI and our AI-powered
            conversations.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-white/20 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-purple-50 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-purple-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-purple-500" />
                  )}
                </div>
              </button>

              {openIndex === index && (
                <div className="px-8 pb-6 border-t border-purple-200">
                  <p className="text-gray-600 leading-relaxed pt-4">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-purple-200">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-gray-900 mb-1">
                Still have questions?
              </h3>
              <p className="text-gray-600 text-sm">
                Our support team is here to help 24/7
              </p>
            </div>
            <button className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
