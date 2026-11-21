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

// Runs before the first paint: the language the visitor chose (so a Korean visitor never sees the
// opening card in English first) and whether the opening card was already shown in this visit.
const EARLY = `try{var d=document.documentElement,q=new URLSearchParams(location.search).get("lang"),l=q==="ko"||q==="en"?q:localStorage.getItem("seoul.lang");if(l==="ko"||l==="en")d.dataset.lang=l;if(sessionStorage.getItem("seoul.intro"))d.dataset.intro="seen"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: EARLY }} />
      </head>
      <body>
        {children}
        <PointerHalo />
      </body>
    </html>
  );
}
