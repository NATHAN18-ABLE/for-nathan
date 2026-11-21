import { jongno } from "./jongno";
import { seodaemun } from "./seodaemun";
import { yongsan } from "./yongsan";
import { gangnam } from "./gangnam";
import type { RoomConfig } from "../types";

// Built rooms. List a scene here and its slug in src/lib/metaverse/open.ts.
export const BUILT_ROOMS: Record<string, RoomConfig> = { jongno, seodaemun, yongsan, gangnam };
