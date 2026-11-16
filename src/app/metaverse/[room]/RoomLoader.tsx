"use client";

import dynamic from "next/dynamic";
import { BUILT_ROOMS } from "@/metaverse/rooms";

// The 3D room only runs in the browser, and only loads when someone opens it.
const MetaverseRoom = dynamic(() => import("@/metaverse/MetaverseRoom").then((m) => m.MetaverseRoom), {
  ssr: false,
  loading: () => <div style={{ position: "fixed", inset: 0, background: "linear-gradient(#c9dcee, #f7f2e8 70%)" }} />,
});

export function RoomLoader({ slug }: { slug: string }) {
  return <MetaverseRoom room={BUILT_ROOMS[slug]} />;
}
