"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ROOM_LOADERS } from "@/metaverse/rooms";
import type { RoomConfig } from "@/metaverse/types";

const Waiting = () => <div style={{ position: "fixed", inset: 0, background: "linear-gradient(#c9dcee, #f7f2e8 70%)" }} />;

// The 3D room only runs in the browser, and only loads when someone opens it.
const MetaverseRoom = dynamic(() => import("@/metaverse/MetaverseRoom").then((m) => m.MetaverseRoom), {
  ssr: false,
  loading: Waiting,
});

export function RoomLoader({ slug }: { slug: string }) {
  const [room, setRoom] = useState<RoomConfig | null>(null);
  useEffect(() => {
    let live = true;
    ROOM_LOADERS[slug]?.().then((r) => live && setRoom(r));
    return () => {
      live = false;
    };
  }, [slug]);
  return room ? <MetaverseRoom room={room} /> : <Waiting />;
}
