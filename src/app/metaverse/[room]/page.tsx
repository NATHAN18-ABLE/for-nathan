import { notFound } from "next/navigation";
import { BUILT_ROOMS } from "@/metaverse/rooms";
import { RoomLoader } from "./RoomLoader";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(BUILT_ROOMS).map((room) => ({ room }));
}

export async function generateMetadata({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params;
  const r = BUILT_ROOMS[room];
  return { title: r ? `${r.name.en} room · Seoul, Curated` : "Seoul, Curated" };
}

export default async function Page({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params;
  if (!BUILT_ROOMS[room]) notFound();
  return <RoomLoader slug={room} />;
}
