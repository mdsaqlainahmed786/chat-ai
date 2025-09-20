import Hero from "@/components/Hero";
import Features from "@/components/Features";
import GeminiPower from "@/components/GeminiPower";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ConnectToWorld from "@/components/ConnectToWorld";

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <GeminiPower />
      <ConnectToWorld />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
};

export default LandingPage;
