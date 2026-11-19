import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontSans, fontSerif } from "./fonts";
import { StageScale } from "@/components/shell/StageScale";
import { SmoothScroll } from "@/components/shell/SmoothScroll";
import { PageTransition } from "@/components/shell/PageTransition";
import { CursorTag } from "@/components/shell/CursorTag";
import { SelectionColor } from "@/components/shell/SelectionColor";
import { ClickSound } from "@/components/shell/ClickSound";
import { PartyMode } from "@/components/shell/PartyMode";
import { PhoneShell } from "@/components/mobile/PhoneShell";
import { ReviewNotes } from "@/components/dev/ReviewNotes";
import { INDEXABLE, SITE_URL } from "@/lib/site";
import site from "@/data/site.json";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: site.seo.defaultTitle, template: site.seo.titleTemplate },
  description: site.seo.description,
  openGraph: { siteName: site.seo.siteName, type: "website", locale: site.seo.locale },
  robots: INDEXABLE ? { index: true, follow: true } : { index: false, follow: false, noarchive: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: site.seo.themeColor,
};

/**
 * The desktop design is drawn at 1440. Zoom the stage to the viewport width and expose
 * the viewport height in design units (--vh) before first paint, so nothing
 * jumps. The width is the window minus the scrollbar gutter (html reserves it on every page, see
 * globals.css; reserved here too so it does not wait for the stylesheet). The scrollbar is measured
 * on a probe: Chrome's root clientWidth ignores the reserved gutter on pages that don't scroll. Kept in sync on resize by components/shell/StageScale.
 * A phone (under 1024 px or touch only, lib/device) gets html.phone and the 390 stage instead.
 */
const SCALE_BEFORE_PAINT = `(function(){var r=document.documentElement,d=document.createElement("div");r.style.scrollbarGutter="stable";d.style.cssText="position:absolute;top:-999px;width:99px;height:99px;overflow:scroll";r.appendChild(d);var b=d.offsetWidth-d.clientWidth;r.removeChild(d);var c=matchMedia("(pointer: coarse)").matches&&!matchMedia("(pointer: fine)").matches,p=innerWidth<1024||c;if(p)r.classList.add("phone");var s=p?innerWidth/390:(innerWidth-b)/1440;r.style.setProperty("--app-scale",s.toFixed(4));r.style.setProperty("--vh",(innerHeight/s).toFixed(2)+"px")})()`;

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
        <ClickSound />
        <div className="stage">
          {children}
          <PartyMode />
          <CursorTag />
          <SelectionColor />
          <PhoneShell />
        </div>
        <PageTransition />
        {/* Review notes (C = comment mode), dev server only: never in a Netlify build. */}
        {process.env.NODE_ENV === "development" && <ReviewNotes />}
      </body>
    </html>
  );
}
