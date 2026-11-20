"use client";

import { createContext, useContext } from "react";
import { useThree } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import { toon } from "./material";

export const LINE = "#3d2d2f";
export const LINE_PX = 1.7;

/** How much a figure draws: far-away travelers skip their outlines and shadows. */
export const Detail = createContext({ lines: true, shadows: true });

/** One toon-shaded piece with the figure's ink outline. */
export function Part({ color, line = true, children, ...props }: {
  color: string;
  line?: boolean;
  children?: React.ReactNode;
} & Omit<React.ComponentProps<"mesh">, "children" | "material">) {
  const dpr = useThree((s) => s.viewport.dpr);
  const detail = useContext(Detail);
  return (
    <mesh castShadow={detail.shadows} material={toon(color)} {...props}>
      {children}
      {line && detail.lines && <Outlines thickness={LINE_PX * dpr} color={LINE} />}
    </mesh>
  );
}

/** The outline alone, for meshes that bring their own material. */
export function Ink({ scale = 1 }: { scale?: number }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const detail = useContext(Detail);
  return detail.lines ? <Outlines thickness={LINE_PX * scale * dpr} color={LINE} /> : null;
}
