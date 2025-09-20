import React, { useEffect, useRef, useState } from "react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

const Testimonials: React.FC = () => {
const testimonials = [
  {
    rating: 5,
    review:
        "ChatAI has revolutionized how our team collaborates. The @AI feature gives us instant insights that would take hours to research manually.",
    name: "Mark Twain",
    image:"https://i.pravatar.cc/150?img=1"
  },
  {
    rating: 5,
    review:
        "The real-time AI responses are incredibly accurate. It's like having a senior expert in every conversation helping solve complex problems.",
    name: "Robert Frost",
    image:"https://i.pravatar.cc/150?img=2"
  },
  {
    rating: 5,
    review:
    "Our team productivity increased by 40% since using ChatAI. The AI understands context perfectly and provides relevant suggestions.",
    name: "Edgar Allan Poe",
    image:"https://i.pravatar.cc/150?img=3"
  },
  {
    rating: 5,
    review:
        "As a small team, having AI assistance in our daily conversations is like adding a world-class consultant to every discussion.",
    name: "William Faulkner",
    image:"https://i.pravatar.cc/150?img=4"
  },
  {
    rating: 5,
    review:
        "The multi-language support is phenomenal. Our global team can now communicate seamlessly with AI helping bridge any gaps.",
    name: "Sarah Kay",
    image:"https://i.pravatar.cc/150?img=5"
  },
  {
    rating: 5,
    review:
        "ChatAI sparks creativity in ways I never expected. The AI suggestions often lead us to breakthrough ideas we wouldn't have found alone.",
    name: "James Herriot",
    image:"https://i.pravatar.cc/150?img=6"
  },
];

  // -----------------------
  // Inline CountUp component
  // -----------------------
  type CountUpProps = {
    end: number;
    duration?: number; // ms
    decimals?: number;
    compact?: boolean;
    suffix?: string;
    className?: string;
    startOnMount?: boolean;
  };

  function easeOutQuad(t: number) {
    return t * (2 - t);
  }

  const CountUp: React.FC<CountUpProps> = ({
    end,
    duration = 900,
    decimals = 0,
    compact = false,
    suffix = "",
    className,
    startOnMount = false,
  }) => {
    const [value, setValue] = useState<number>(0);
    const ref = useRef<HTMLDivElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const startedRef = useRef(false);

    useEffect(() => {
      if (startOnMount) {
        start();
        return cleanup;
      }

      const el = ref.current;
      if (!el) return;

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !startedRef.current) {
              start();
            }
          });
        },
        { threshold: 0.3 }
      );

      io.observe(el);
      return () => {
        io.disconnect();
        cleanup();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [end, duration, decimals, compact, suffix, startOnMount]);

    function cleanup() {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    function start() {
      startedRef.current = true;
      const startTs = performance.now();
      const initial = 0;
      const delta = end - initial;

      function step(now: number) {
        const elapsed = now - startTs;
        const t = Math.min(1, elapsed / duration);
        const eased = easeOutQuad(t);
        const current = initial + delta * eased;
        setValue(current);

        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          setValue(end);
        }
      }

      rafRef.current = requestAnimationFrame(step);
    }

    function formatNumber(n: number) {
      if (compact) {
        return new Intl.NumberFormat("en", {
          notation: "compact",
          maximumFractionDigits: decimals,
        }).format(n);
      }

      return new Intl.NumberFormat("en", {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      }).format(n);
    }

    const displayed =
      decimals > 0 ? Number(value.toFixed(decimals)) : Math.round(value);

    return (
      <div ref={ref} className={className}>
        <span aria-hidden>{formatNumber(displayed)}</span>
        {suffix && <span className="ml-1">{suffix}</span>}
      </div>
    );
  };

  return (
    <section
      id="testimonials"
      className="pt-14 pb-24 bg-gradient-to-b from-white to-purple-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-500 mb-6">
            <span className="text-sm font-medium">Testimonials</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Loved by Teams
            <span className="bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent">
              {" "}
              Worldwide
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of teams who have transformed their communication
            with AI-powered conversations.
          </p>
        </div>

        {/* Testimonials Grid */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group relative p-8 bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <review className="w-8 h-8 text-purple-500" />
              </div>

              
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-yellow-400 fill-current"
                  />
                ))}
              </div>

            
              <p className="text-gray-600 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

            
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
        </div> */}

         <div className="h-[20rem] rounded-md flex flex-col antialiased bg-white dark:bg-black dark:bg-grid-white/[0.05] items-center justify-center relative overflow-hidden">
      <InfiniteMovingCards
        items={testimonials}
        direction="right"
        speed="slow"
      />
    </div>

        {/* Stats Section with in-file CountUp */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 border-t border-purple-200">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-purple-500 mb-2">
              <CountUp
                end={10000}
                duration={1300}
                decimals={0}
                compact={false}
                suffix="+"
                className="inline"
              />
            </div>
            <div className="text-gray-600">Active Teams</div>
          </div>

          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-purple-500 mb-2">
              <CountUp
                end={500_000_000}
                duration={1600}
                decimals={0}
                compact={true}
                suffix="+"
                className="inline"
              />
            </div>
            <div className="text-gray-600">AI Responses</div>
          </div>

          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-purple-500 mb-2">
              <CountUp
                end={99.9}
                duration={900}
                decimals={1}
                compact={false}
                suffix="%"
                className="inline"
              />
            </div>
            <div className="text-gray-600">Uptime</div>
          </div>

          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-purple-500 mb-2">
              <CountUp
                end={4.9}
                duration={900}
                decimals={1}
                compact={false}
                suffix="★"
                className="inline"
              />
            </div>
            <div className="text-gray-600">User Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
