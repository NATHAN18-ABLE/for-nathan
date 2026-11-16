import type { ComponentType } from "react";
import type { P, Walkable } from "@/lib/metaverse/path.ts";
import type { Hill } from "./world";

export interface Poi {
  id: string;
  at: P;
  radius: number;
  title: { en: string; ko: string };
  line: { en: string; ko: string };
}

export interface RoomConfig {
  slug: string;
  name: { en: string; ko: string };
  place: { en: string; ko: string };
  hour: { en: string; ko: string };
  walk: Walkable;
  spawn: P;
  spawnHeading?: number; // radians, 0 faces +z
  // v2 rooms: terrain hills, sky image and fog [color, near, far]
  world?: { hills: Hill[]; hdr: string; fog: [string, number, number] };
  // Where seated sit emotes look natural (a platform or bench). Optional.
  seats?: P[];
  sky: { top: string; bottom: string };
  sun: { position: [number, number, number]; color: string; intensity: number };
  ambient: { sky: string; ground: string; intensity: number };
  pois: Poi[];
  Scene: ComponentType;
}
