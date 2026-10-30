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
 * Contact. Always exactly one
 * screen, never scrolls. The title, one row of space (82 px), then one horizontal row: the
 * gif in the first columns, Jordan / Adrea / Studio. The block starts at the screen's 22% so it keeps
 * its place on taller screens. Footer © / credits / legal / socials.
 * 9-col grid: title 6 cols, gif 3 cols, Jordan col 4, Adrea col 6, Studio col 8; the footer
 * under them, © on col 2 (col 1 is the floss logo's).
 * Footer: © col 2, Legal col 3, Credits
 * col 4, LinkedIn over Instagram on col 6 (left-aligned), the butterfly on col 8 (no label),
 * out of the bottom-right toggles; the sound toggle stays bottom right.
 * One bottom line: every footer text sits on SOUND / OFF's baseline (23.6 above the
 * screen bottom; Label/Mini's baseline is 1.8 above its box), LinkedIn and Instagram side by side,
 * the butterfly chip's bottom on the same line.
 */
const L = {
  block: "top-[22.17%] inset-x-0",
  butterfly: "bottom-4 left-col-8", // the 24 square on the SOUND chip line, bottom 16
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
            <img src="/media/contact/steve-brule.gif" alt="Dr. Steve Brule holding a microphone" width={480} height={265} className="h-[265px] w-[480px] max-w-none object-cover" />
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
