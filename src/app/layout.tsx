import type { Metadata, Viewport } from "next";
import "@fontsource-variable/jost";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seoul, Curated",
  description:
    "Answer twelve quiet questions and meet the Seoul district that suits you, with a day to spend there. A concept proposal.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#f6f6f3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
