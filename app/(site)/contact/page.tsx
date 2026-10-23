import type { Metadata } from "next";
import site from "@/data/site.json";
import { Chrome } from "@/components/shell/Chrome";
import { ContactLink } from "@/components/ui/ContactLink";
import { FooterLinks } from "@/components/ui/FooterLinks";
import { ToggleButterfly } from "@/components/ui/ToggleButterfly";
import { ContactMobile } from "@/components/mobile/ContactMobile";
import { ByDevice } from "@/components/mobile/ByDevice";

export const metadata: Metadata = { title: "Contact" };

const tel = (n: string) => `tel:+1${n.replace(/\D/g, "")}`;

/**
 * Contact (V1 · 10 · Contact, 7345:1649; revised on V2 · 10 · Contact 7653:2446). Always exactly one
 * screen, never scrolls. Revision: the title, one row of space (82 px), then one horizontal row: the
 * gif in the first columns, Jordan / Adrea / Studio. The block starts at the frame's 22% so it keeps
 * its place on taller screens. Footer © / credits / legal / socials.
 * 9-col grid (Oct 19): title 6 cols, gif 3 cols, Jordan col 4, Adrea col 6, Studio col 8; the footer
 * under them, © on col 2 (col 1 is the floss logo's).
 * Footer realigned on V2 · 10 · Contact · 9-col (7684:2720, Oct 22): © col 2, Privacy col 3, Credits
 * col 4, LinkedIn over Instagram on col 6 (left-aligned), the butterfly on col 8 (no "Click me"
 * label since Oct 22), out of the bottom-right toggles; the sound toggle stays bottom right.
 * One bottom line (Amélie, Oct 22): every footer text sits on SOUND / OFF's baseline (23.6 above the
 * screen bottom; Label/Mini's baseline is 1.8 above its box), LinkedIn and Instagram side by side,
 * the butterfly chip's bottom on the same line.
 */
const L = {
  block: "top-[22.17%] inset-x-0",
  butterfly: "bottom-[23.6px] left-col-8",
};

export default function ContactPage() {
  return <ByDevice desktop={<ContactDesktop />} phone={<ContactMobile />} />;
}

function ContactDesktop() {
  const { contact } = site;
  const [jordan, adrea] = contact.people;
  return (
    <main className="relative h-(--vh) overflow-hidden bg-neutral-0">
      <div className={`absolute flex flex-col gap-[82px] ${L.block}`}>
        <h1 className="t-h2-indent ml-margin w-span-6">{contact.title}</h1>

        <div className="relative h-[265px]">
          <div className="absolute top-0 left-margin flex w-span-3 justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/contact/rihanna-hear.gif" alt="" width={480} height={265} className="h-[265px] w-[480px] max-w-none object-cover" />
          </div>

          <address className="not-italic">
            <div className="absolute top-0 left-col-4 flex flex-col gap-1">
              <p className="t-h5">{jordan.name}</p>
              <p className="t-h5 whitespace-pre">{jordan.role}</p>
              <ContactLink href={`mailto:${jordan.email}`}>{jordan.email}</ContactLink>
              {jordan.phone && <ContactLink href={tel(jordan.phone)}>{jordan.phone}</ContactLink>}
            </div>

            <div className="absolute top-0 left-col-6 flex flex-col gap-1">
              <p className="t-h5">{adrea.name}</p>
              <p className="t-h5">{adrea.role}</p>
              <ContactLink href={`mailto:${adrea.email.replace(/[[\]]/g, "")}`}>{adrea.email}</ContactLink>
            </div>

            <div className="absolute top-0 left-col-8 flex flex-col gap-1">
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
        </div>
      </div>

      <footer>
        <FooterLinks />
        <div className={`fixed z-50 ${L.butterfly}`}>
          <ToggleButterfly />
        </div>
      </footer>

      <Chrome />
    </main>
  );
}
