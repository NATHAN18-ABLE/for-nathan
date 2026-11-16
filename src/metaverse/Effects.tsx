"use client";

import { EffectComposer, N8AO, Bloom, Vignette, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

/** Soft contact shadows, a glow for lanterns and lamps, and a gentle vignette. */
export function Effects({ low }: { low: boolean }) {
  return (
    <EffectComposer multisampling={low ? 2 : 4} enableNormalPass={false}>
      {/* Full resolution only: half-resolution AO left a haze around the figures. */}
      <N8AO aoRadius={1.3} intensity={low ? 1.6 : 2.3} distanceFalloff={1} quality={low ? "performance" : "medium"} />
      <Bloom luminanceThreshold={0.96} luminanceSmoothing={0.08} intensity={0.55} mipmapBlur />
      <Vignette offset={0.3} darkness={0.45} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  );
}
