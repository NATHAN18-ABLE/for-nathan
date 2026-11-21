import type { RoomConfig } from "../types";

// Built rooms, each loaded on its own: opening one room never downloads the others' scenes.
// List a scene here and its slug in src/lib/metaverse/open.ts.
export const ROOM_LOADERS: Record<string, () => Promise<RoomConfig>> = {
  jongno: () => import("./jongno").then((m) => m.jongno),
  seodaemun: () => import("./seodaemun").then((m) => m.seodaemun),
  yongsan: () => import("./yongsan").then((m) => m.yongsan),
  gangnam: () => import("./gangnam").then((m) => m.gangnam),
  yeongdeungpo: () => import("./yeongdeungpo").then((m) => m.yeongdeungpo),
};
