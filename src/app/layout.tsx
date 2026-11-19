import type { Metadata, Viewport } from "next";
// Pretendard: the typeface most Korean websites use, with matching Latin letters.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { PointerHalo } from "@/components/PointerHalo";

export const metadata: Metadata = {
  title: "Seoul, Curated",
  description:
    "A few simple questions to find the part of Seoul that suits you, and a day to spend there. A concept proposal for a personalized Seoul travel site.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#ebe8e1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PointerHalo />
      </body>
    </html>
  );
}
