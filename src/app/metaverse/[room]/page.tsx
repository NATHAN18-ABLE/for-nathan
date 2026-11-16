import { notFound } from "next/navigation";
import { OPEN_ROOMS } from "@/lib/metaverse/open.ts";
import { DISTRICTS } from "@/lib/match/districts.ts";
import { RoomLoader } from "./RoomLoader";

// Server side only needs the list of open rooms and their names; the 3D scenes are
// client modules and load in the browser.
export const dynamicParams = false;

export function generateStaticParams() {
  return OPEN_ROOMS.map((room) => ({ room }));
}

export async function generateMetadata({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params;
  const name = DISTRICTS.find((d) => d.slug === room)?.nameEn;
  return { title: name ? `${name} room · Seoul, Curated` : "Seoul, Curated" };
}

export default async function Page({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params;
  if (!OPEN_ROOMS.includes(room)) notFound();
  return <RoomLoader slug={room} />;
}
