import type { ComponentType } from "react";
import type { P, Walkable } from "@/lib/metaverse/path.ts";

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
  // Where seated sit emotes look natural (a platform or bench). Optional.
  seats?: P[];
  sky: { top: string; bottom: string };
  sun: { position: [number, number, number]; color: string; intensity: number };
  ambient: { sky: string; ground: string; intensity: number };
  pois: Poi[];
  Scene: ComponentType;
}
