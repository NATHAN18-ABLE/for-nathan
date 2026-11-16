"use client";

import { EffectComposer, N8AO, Bloom, Vignette, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

/** Soft contact shadows, a glow for lanterns and lamps, and a gentle vignette. */
export function Effects({ low }: { low: boolean }) {
  return (
    <EffectComposer multisampling={low ? 0 : 4} enableNormalPass={false}>
      <N8AO aoRadius={1.4} intensity={low ? 1.6 : 2.4} distanceFalloff={1} halfRes={low} quality={low ? "performance" : "medium"} />
      <Bloom luminanceThreshold={0.82} luminanceSmoothing={0.2} intensity={0.75} mipmapBlur />
      <Vignette offset={0.3} darkness={0.45} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  );
}
