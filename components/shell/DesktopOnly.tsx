import site from "@/data/site.json";

const { title, text } = site.desktopOnly;

/**
 * Phones get this instead of the site (Amélie, 15 Oct): the prototype is drawn at 1440 and only
 * built for desktop so far. Pure CSS (globals.css, below 768 px), so there is no flash of the stage.
 * Sits outside the zoomed stage, so it uses real px.
 */
export function DesktopOnly() {
  return (
    <div className="desktop-only fixed inset-0 z-[200] hidden flex-col justify-between bg-aqua p-6 text-neutral-1000">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/logo-floss.webp" alt="Eleven" width={80} height={85} className="block" />
      <div className="flex flex-col gap-4">
        <p className="font-serif text-[44px] leading-[0.95]">{title}</p>
        <p className="t-body max-w-[300px]">{text}</p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/eleven-wordmark.svg" alt="" width={100} height={20.4146} className="block rotate-4" />
    </div>
  );
}
