"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

/** A glow for lanterns and lit lamps, and a light vignette. Toon colours stay as painted. */
export function Effects({ low }: { low: boolean }) {
  return (
    <EffectComposer multisampling={low ? 2 : 4} enableNormalPass={false}>
      <Bloom luminanceThreshold={1.05} luminanceSmoothing={0.1} intensity={0.5} mipmapBlur />
      <Vignette offset={0.35} darkness={0.28} />
    </EffectComposer>
  );
}
