import type { ComponentType } from "react";
import type { P, Walkable } from "@/lib/metaverse/path.ts";
import type { Hill } from "./world";

export interface Poi {
  id: string;
  at: P;
  radius: number;
  title: { en: string; ko: string };
  line: { en: string; ko: string };
  // What the traveler can do here: hang a wish lantern, sit down, or watch a craftsperson.
  action?: "lantern" | "sit" | "watch";
  // Walk to (x, z), then sit at `on` (off the floor, e.g. on a platform edge) at height y.
  seat?: { x: number; z: number; heading: number; on?: { x: number; z: number; y: number } };
}

export interface RoomConfig {
  slug: string;
  name: { en: string; ko: string };
  place: { en: string; ko: string };
  hour: { en: string; ko: string };
  walk: Walkable;
  spawn: P;
  spawnHeading?: number; // radians, 0 faces +z
  // v2 rooms: terrain hills and fog [color, near, far]; the sky is painted from `sky`
  world?: { hills: Hill[]; fog: [string, number, number] };
  // Where seated sit emotes look natural (a platform or bench). Optional.
  seats?: P[];
  sky: { top: string; bottom: string };
  sun: { position: [number, number, number]; color: string; intensity: number };
  ambient: { sky: string; ground: string; intensity: number };
  pois: Poi[];
  lamps?: [number, number][]; // street lamps travelers can light
  lanterns?: boolean; // this room has the wish-lantern rack
  // Extra shapes for the 2D map: building blocks and walls [x0,z0,x1,z1], green patches [x,z,r].
  map?: { blocks?: [number, number, number, number][]; walls?: [number, number, number, number][]; green?: [number, number, number][] };
  Scene: ComponentType; // static: its transforms are frozen after the first frame
  Live?: ComponentType; // moving parts of the room (workshop hammer, etc.)
}
