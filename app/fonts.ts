import localFont from "next/font/local";

/**
 * Type, from the Figma Typography collection.
 * Serif: Junicode VF (OFL), subset to Latin, wght 300–700 + wdth 75–125 axes.
 * Sans: Neue Haas Grotesk. The Figma uses Display Pro; the prototype runs on the
 * TX Pro cut from the studio library (55 / 65 / 75) as a stand-in. Needs a web
 * licence before launch.
 */
export const fontSerif = localFont({
  src: [{ path: "../public/fonts/JunicodeVF-Roman.woff2", weight: "300 700", style: "normal" }],
  variable: "--font-junicode",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const fontSans = localFont({
  src: [
    { path: "../public/fonts/NHaasGrotesk-55.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/NHaasGrotesk-65.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/NHaasGrotesk-75.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-haas",
  display: "swap",
  fallback: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
});
