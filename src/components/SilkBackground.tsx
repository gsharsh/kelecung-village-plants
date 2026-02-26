"use client";

import dynamic from "next/dynamic";

const Silk = dynamic(() => import("@/components/Silk"), {
  ssr: false,
});

export function SilkBackground() {
  return (
    <div aria-hidden="true" className="app-silk-background">
      <div className="app-silk-canvas">
        <Silk speed={3.7} scale={0.9} color="#cdbe92" noiseIntensity={3.5} rotation={0} />
      </div>
      <div className="app-silk-tint" />
    </div>
  );
}
