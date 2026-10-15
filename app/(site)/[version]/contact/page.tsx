import type { Metadata } from "next";
import site from "@/data/site.json";
import { Chrome } from "@/components/shell/Chrome";
import { ContactLink } from "@/components/ui/ContactLink";
import { MiniLink } from "@/components/ui/MiniLink";
import { CreditsPopover } from "@/components/ui/CreditsPopover";
import { ToggleButterfly } from "@/components/ui/ToggleButterfly";
import { Clock } from "@/components/shell/Clock";

export const metadata: Metadata = { title: "Contact" };

const tel = (n: string) => `tel:+1${n.replace(/\D/g, "")}`;

/**
 * Contact, one layout per version, each from its own Figma frame. Always exactly one screen, never
 * scrolls: vertical positions use the frame's own percentages of the height, the footer sits on the bottom.
 * V1 · 10 · Contact (7345:1649): contacts stacked in the 637 column, footer © / privacy / credits / socials.
 * V2 · 10 · Contact (7451:2292): title lower, gif level with three contact columns (493 / 845 / 1197),
 * footer © · Credits · LA clock ("time machine", 7642:2397) · Instagram + LinkedIn · Privacy at the far right.
 */
const LAYOUT = {
  v1: {
    title: "top-[calc(8.33%+63.67px)] left-[32px]",
    gif: "top-[calc(25%+24px)]",
    jordan: "top-[calc(41.67%+7.33px)] left-[637px]",
    adrea: "top-[calc(50%+44px)] left-[637px] pt-3",
    studio: "top-[calc(66.67%+6.33px)] left-[637px] pt-3",
    copyright: "bottom-[22px] left-[263.5px]",
    privacy: "bottom-[23px] left-[637px]",
    credits: "bottom-[23px] left-[845.5px]",
    clock: null,
    linkedin: "bottom-[39px] left-[1080.5px]",
    instagram: "bottom-[23px] left-[1080.5px]",
  },
  v2: {
    title: "top-[calc(16.67%+56.33px)] left-[24px]",
    gif: "top-[calc(41.67%+10.33px)]",
    jordan: "top-[calc(41.67%+10.33px)] left-[493px]",
    adrea: "top-[calc(41.67%+10.33px)] left-[845px]",
    studio: "top-[calc(41.67%+10.33px)] left-[1197px]",
    copyright: "bottom-[22px] left-[24px]",
    privacy: "bottom-[23px] left-[1341px]",
    credits: "bottom-[23px] left-[493px]",
    clock: "bottom-[22px] left-[845px]",
    linkedin: "bottom-[23px] left-[1197px]",
    instagram: "bottom-[39px] left-[1197px]",
  },
};

export default async function ContactPage({ params }: { params: Promise<{ version: string }> }) {
  const { version } = await params;
  const L = version === "v2" ? LAYOUT.v2 : LAYOUT.v1;
  const { contact, footer } = site;
  const [jordan, adrea] = contact.people;
  const social = (label: string) => footer.social.find((x) => x.label === label)!;
  return (
    <main className="relative h-(--vh) overflow-hidden bg-neutral-0">
      <h1 className={`t-h2-indent absolute w-[822px] ${L.title}`}>{contact.title}</h1>

      <div className={`absolute left-[24px] flex w-[348px] justify-center overflow-hidden ${L.gif}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/contact/rihanna-hear.gif" alt="" width={480} height={265} className="h-[265px] w-[480px] max-w-none object-cover" />
      </div>

      <address className="not-italic">
        <div className={`absolute flex flex-col gap-1 ${L.jordan}`}>
          <p className="t-h5">{jordan.name}</p>
          <p className="t-h5 whitespace-pre">{jordan.role}</p>
          <ContactLink href={`mailto:${jordan.email}`}>{jordan.email}</ContactLink>
          {jordan.phone && <ContactLink href={tel(jordan.phone)}>{jordan.phone}</ContactLink>}
        </div>

        <div className={`absolute flex flex-col gap-1 ${L.adrea}`}>
          <p className="t-h5">{adrea.name}</p>
          <p className="t-h5">{adrea.role}</p>
          <ContactLink href={`mailto:${adrea.email.replace(/[[\]]/g, "")}`}>{adrea.email}</ContactLink>
        </div>

        <div className={`absolute flex w-[332px] flex-col gap-1 ${L.studio}`}>
          <p className="t-h5">{contact.studio.label}</p>
          <ContactLink href={contact.studio.map}>
            {contact.studio.lines.map((l) => (
              <span key={l} className="block [&+&]:mt-1">
                {l}
              </span>
            ))}
          </ContactLink>
          <ContactLink href={tel(contact.studio.phone)}>{contact.studio.phone}</ContactLink>
        </div>
      </address>

      <footer>
        <p className={`t-mini absolute ${L.copyright}`}>{footer.copyright}</p>
        <MiniLink href={footer.legal[0].href} className={`absolute ${L.privacy}`}>
          {footer.legal[0].label}
        </MiniLink>
        <CreditsPopover label={footer.credits.label} items={footer.credits.items} className={`absolute ${L.credits}`} />
        {L.clock && <Clock className={`t-mini absolute uppercase ${L.clock}`} />}
        <MiniLink href={social("LinkedIn").href} className={`absolute ${L.linkedin}`}>
          {social("LinkedIn").label}
        </MiniLink>
        <MiniLink href={social("Instagram").href} className={`absolute ${L.instagram}`}>
          {social("Instagram").label}
        </MiniLink>
      </footer>

      <Chrome toggles={<ToggleButterfly />} />
    </main>
  );
}
