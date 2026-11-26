"use client";

import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import type { P } from "./path.ts";
import type { Look } from "./look.ts";
import type { Avatar } from "./outfit.ts";
import type { WishId } from "./lanterns.ts";

import { SUPABASE_KEY as KEY, SUPABASE_URL as URL } from "../supabase-config.ts";

let client: SupabaseClient | null = null;
const supabase = () => (client ??= createClient(URL, KEY, { realtime: { params: { eventsPerSecond: 8 } } }));

export interface Presence {
  id: string;
  joinedAt: number;
  name: string;
  type: string | null; // travel type code, when the test is done
  look: Look;
  avatar?: Avatar; // figure and outfit from the wardrobe; checked with sanitizeAvatar on arrival
  x: number;
  z: number;
  heading: number;
}

export type RoomEvent =
  | { kind: "move"; id: string; path: P[]; speed?: number }
  | { kind: "say"; id: string; phrase: string }
  | { kind: "chat"; id: string; text: string }
  | { kind: "signal"; id: string }
  // a room's own interaction (ring the bell, feed the magpies...): every traveler sees it play
  | { kind: "use"; id: string; effect: string }
  | { kind: "emote"; id: string; emote: string }
  | { kind: "lantern"; id: string; lantern: Lantern }
  | { kind: "lamp"; id: string; lamp: number };

export interface Lantern {
  wish: WishId;
  color: number;
  name: string;
  created_at?: string;
}

export interface RoomHandlers {
  onMembers: (members: Presence[]) => void;
  onEvent: (e: RoomEvent) => void;
  onStatus: (status: "connecting" | "live" | "offline") => void;
}

export interface RoomConnection {
  /** Change what others see of me (look, outfit). Sent at most once per PRESENCE_GAP_MS, merged. */
  update: (patch: Partial<Presence>) => void;
  /** Keep my latest spot for the next (re)join without sending anything: positions travel as broadcasts. */
  remember: (patch: Partial<Presence>) => void;
  send: (e: RoomEvent) => void;
  leave: () => void;
}

/** Channel name for one copy of a room ("jongno", copy 2 → "room:jongno:2"). */
const topic = (room: string, instance: number) => `room:${room}:${instance}`;

// Supabase closes the channel of a client that sends Presence too often (measured: the 6th
// update within about 20 seconds). Presence therefore carries only who is here and how they
// look; movement goes over broadcast, and look changes are merged and spaced out.
const PRESENCE_GAP_MS = 10000; // 7 s apart held for 12 updates in a row; 3 s apart was cut at the 6th
const RETRY_MS = [2000, 5000, 10000, 20000, 30000];

export function joinRoom(room: string, instance: number, me: Presence, h: RoomHandlers): RoomConnection {
  let state = { ...me };
  let channel: RealtimeChannel | null = null;
  let left = false;
  let retries = 0;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let lastTrack = 0;
  let trackTimer: ReturnType<typeof setTimeout> | undefined;
  let dirty = false;

  const track = () => {
    trackTimer = undefined;
    if (!channel || left) return;
    dirty = false;
    lastTrack = Date.now();
    channel.track(state);
  };

  const open = () => {
    if (left) return;
    h.onStatus("connecting");
    const c = supabase().channel(topic(room, instance), {
      config: { presence: { key: me.id }, broadcast: { self: false } },
    });
    channel = c;
    c.on("presence", { event: "sync" }, () => {
      if (channel !== c) return;
      const all = c.presenceState<Presence>();
      h.onMembers(Object.values(all).map((list) => list[0]).filter(Boolean));
    })
      .on("broadcast", { event: "room" }, ({ payload }) => h.onEvent(payload as RoomEvent))
      .subscribe(async (status) => {
        if (channel !== c || left) return;
        if (status === "SUBSCRIBED") {
          retries = 0;
          clearTimeout(trackTimer);
          track();
          h.onStatus("live");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          // Closed by the server or the network: come back on our own, a little later each time.
          h.onStatus("offline");
          channel = null;
          supabase().removeChannel(c);
          clearTimeout(retryTimer);
          retryTimer = setTimeout(open, RETRY_MS[Math.min(retries++, RETRY_MS.length - 1)]);
        }
      });
  };
  open();

  return {
    update(patch) {
      state = { ...state, ...patch };
      dirty = true;
      if (trackTimer || !channel) return; // already waiting, or the next join sends it
      trackTimer = setTimeout(() => dirty && track(), Math.max(0, lastTrack + PRESENCE_GAP_MS - Date.now()));
    },
    remember(patch) {
      state = { ...state, ...patch };
    },
    send(e) {
      // Only over the socket: before the channel is joined, supabase-js would fall back to HTTP.
      if (channel?.state === "joined") channel.send({ type: "broadcast", event: "room", payload: e });
    },
    leave() {
      left = true;
      clearTimeout(retryTimer);
      clearTimeout(trackTimer);
      const c = channel;
      channel = null;
      if (c) {
        c.untrack();
        supabase().removeChannel(c);
      }
    },
  };
}

/** Listen to how many people are in one copy of a room without joining it. */
export function watchRoom(room: string, instance: number, onCount: (n: number) => void): () => void {
  let channel: RealtimeChannel | null = supabase().channel(topic(room, instance), {
    config: { presence: { key: `watch-${Math.random().toString(36).slice(2)}` } },
  });
  channel.on("presence", { event: "sync" }, () => {
    if (channel) onCount(Object.keys(channel.presenceState()).length);
  });
  channel.subscribe();
  return () => {
    const c = channel;
    channel = null;
    if (c) supabase().removeChannel(c);
  };
}

/** A quick look at how full each copy of a room is (copies 1..max), then stop listening. */
export function peekCounts(room: string, max: number, waitMs = 1800): Promise<number[]> {
  return new Promise((resolve) => {
    const counts = Array.from({ length: max }, () => 0);
    const stops = counts.map((_, i) => watchRoom(room, i + 1, (n) => (counts[i] = n)));
    setTimeout(() => {
      stops.forEach((s) => s());
      // Trim empty copies at the end, keeping copy 1.
      let last = counts.length;
      while (last > 1 && counts[last - 1] === 0) last--;
      resolve(counts.slice(0, last));
    }, waitMs);
  });
}

/** Lanterns hung in a room during the last day, oldest first. */
export async function fetchLanterns(room: string): Promise<Lantern[]> {
  const { data, error } = await supabase()
    .from("lanterns")
    .select("wish,color,name,created_at")
    .eq("room", room)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error || !data) return [];
  return data as Lantern[];
}

export async function hangLantern(room: string, l: Lantern): Promise<boolean> {
  const { error } = await supabase().from("lanterns").insert({ room, wish: l.wish, color: l.color, name: l.name });
  return !error;
}
