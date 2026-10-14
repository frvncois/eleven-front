import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontSans, fontSerif } from "./fonts";
import { StageScale } from "@/components/shell/StageScale";
import { SmoothScroll } from "@/components/shell/SmoothScroll";
import { PageTransition } from "@/components/shell/PageTransition";
import { CursorTag } from "@/components/shell/CursorTag";

export const metadata: Metadata = {
  title: { default: "Eleven", template: "%s · Eleven" },
  description: "Eleven, audio post-production in West LA. Website prototype.",
  robots: { index: false, follow: false, noarchive: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fdfcfc",
};

/**
 * The mockup is drawn at 1440. Zoom the stage to the viewport width and expose
 * the viewport height in design units (--vh) before first paint, so nothing
 * jumps. Kept in sync on resize by components/shell/StageScale.
 */
const SCALE_BEFORE_PAINT = `(function(){var r=document.documentElement,s=innerWidth/1440;r.style.setProperty("--app-scale",s.toFixed(4));r.style.setProperty("--vh",(innerHeight/s).toFixed(2)+"px")})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontSerif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCALE_BEFORE_PAINT }} />
      </head>
      {/* One stage, one Lenis, one sweep, one cursor tag for the whole visit, the 404 included,
          so a transition that lands on any page always finishes. */}
      <body>
        <StageScale />
        <SmoothScroll />
        <div className="stage">
          {children}
          <CursorTag />
        </div>
        <PageTransition />
      </body>
    </html>
  );
}
