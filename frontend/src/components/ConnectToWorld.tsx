import React from "react";
import { cn } from "@/lib/utils";
import createGlobe from "cobe";
import { useEffect, useRef } from "react";

export default function ConnectToWorld() {
  const features = [
    {
      title: "Connect to people around the world",
      description:
        "Our AI-powered platform enables seamless global connections, fostering collaboration and communication across borders, Anywhere and Anytime.",
      skeleton: <SkeletonFour />,
      className: "col-span-1 lg:col-span-3 border-b lg:border-none",
    },
  ];
  return (
    <div className="relative z-20 py-10 pt-52 max-w-7xl mx-auto">
      <div className="relative ">
        <div className="">
          {features.map((feature) => (
            <FeatureCard key={feature.title} className={feature.className}>
              <FeatureTitle />
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className=" h-full w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn(`p-4 sm:p-8 relative overflow-hidden`, className)}>
      {children}
    </div>
  );
};

const FeatureTitle = () => {
  return (
    <div className="max-w-5xl flex justify-center space-x-2 mr-auto text-center md:justify-start md:text-start md:flex-col">
      <span className=" tracking-tight text-black dark:text-white font-bold text-2xl md:text-6xl md:leading-snug">
        Connect to the World
      </span>
      <span>
        <span className="text-2xl md:text-6xl font-bold bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent">
          Globally
        </span>
      </span>
    </div>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p
      className={cn(
        "text-neutral-500 text-center mx-auto md:mx-0 md:text-left pt-3 md:pt-8 dark:text-neutral-300 max-w-sm text-sm md:text-xl font-semibold"
      )}
    >
      {children}
    </p>
  );
};

export const SkeletonFour = () => {
  return (
    <div className="h-60 md:h-80  flex flex-row items-center  justify-between relative bg-transparent dark:bg-transparent mt-10">
      <Globe className="absolute md:mr-0 -right-10 md:-right-10 -bottom-70 md:bottom-30" />
    </div>
  );
};

export const Globe = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.545, 0.361, 0.964],
      markerColor: [0.8, 0.6, 1], // lighter purple for markers
      glowColor: [0.7, 0.4, 1], // glowing purple edge

      markers: [
        // longitude latitude
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.01;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 600, height: 600, maxWidth: "100%", aspectRatio: 1 }}
      className={className}
    />
  );
};
