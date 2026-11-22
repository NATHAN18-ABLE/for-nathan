"use client";

import { EffectComposer, Bloom, N8AO, Vignette } from "@react-three/postprocessing";

/**
 * A soft contact shade where things meet the ground and each other (kept light so the toon
 * colours stay clean), a glow for lanterns and lit lamps, and a light vignette. Phones skip this.
 */
export function Effects({ low, ao }: { low: boolean; ao: boolean }) {
  return (
    <EffectComposer multisampling={low ? 2 : 4} enableNormalPass={false}>
      {/* computers only: tablets keep their frame budget for the travelers */}
      <>{ao && <N8AO aoRadius={0.9} intensity={1.5} distanceFalloff={0.6} quality="medium" color="#3a3350" />}</>
      <Bloom luminanceThreshold={1.05} luminanceSmoothing={0.1} intensity={0.5} mipmapBlur />
      <Vignette offset={0.35} darkness={0.28} />
    </EffectComposer>
  );
}
