"use client";

import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import type { P } from "./path.ts";
import type { Look } from "./look.ts";
import type { WishId } from "./lanterns.ts";

// Public by design: the publishable key only opens Realtime channels, there is no table data.
const URL = "https://qfuzoymuzsnlbirnlsmb.supabase.co";
const KEY = "sb_publishable__9aJ0uP7nHMjCN19evf3Ow_iUOIkI6N";

let client: SupabaseClient | null = null;
const supabase = () => (client ??= createClient(URL, KEY, { realtime: { params: { eventsPerSecond: 8 } } }));

export interface Presence {
  id: string;
  joinedAt: number;
  name: string;
  type: string | null; // travel type code, when the test is done
  look: Look;
  x: number;
  z: number;
  heading: number;
}

export type RoomEvent =
  | { kind: "move"; id: string; path: P[] }
  | { kind: "say"; id: string; phrase: string }
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
  update: (patch: Partial<Presence>) => void;
  send: (e: RoomEvent) => void;
  leave: () => void;
}

/** Channel name for one copy of a room ("jongno", copy 2 → "room:jongno:2"). */
const topic = (room: string, instance: number) => `room:${room}:${instance}`;

export function joinRoom(room: string, instance: number, me: Presence, h: RoomHandlers): RoomConnection {
  let state = { ...me };
  let channel: RealtimeChannel | null = supabase().channel(topic(room, instance), {
    config: { presence: { key: me.id }, broadcast: { self: false } },
  });
  h.onStatus("connecting");

  channel
    .on("presence", { event: "sync" }, () => {
      if (!channel) return;
      const all = channel.presenceState<Presence>();
      h.onMembers(Object.values(all).map((list) => list[0]).filter(Boolean));
    })
    .on("broadcast", { event: "room" }, ({ payload }) => h.onEvent(payload as RoomEvent))
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel?.track(state);
        h.onStatus("live");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        h.onStatus("offline");
      }
    });

  return {
    update(patch) {
      state = { ...state, ...patch };
      channel?.track(state);
    },
    send(e) {
      channel?.send({ type: "broadcast", event: "room", payload: e });
    },
    leave() {
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
