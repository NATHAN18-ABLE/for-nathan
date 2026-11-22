import { notFound } from "next/navigation";
import { CourseView } from "@/components/Districts";
import { COURSES } from "@/lib/districts/courses.ts";
import { DISTRICTS } from "@/lib/match/districts.ts";

export const dynamicParams = false;

export function generateStaticParams() {
  return COURSES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = DISTRICTS.find((d) => d.slug === slug)?.nameEn;
  return { title: name ? `A day in ${name} · Seoul, Curated` : "Seoul, Curated" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!COURSES.some((c) => c.slug === slug)) notFound();
  return <CourseView slug={slug} />;
}
