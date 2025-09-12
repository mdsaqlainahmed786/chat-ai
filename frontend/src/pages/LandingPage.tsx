import Hero from "@/components/Hero";
import Features from "@/components/Features";
import GeminiPower from "@/components/GeminiPower";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <GeminiPower />
      <Testimonials />
      <FAQ />
    </div>
  );
};

export default LandingPage;
