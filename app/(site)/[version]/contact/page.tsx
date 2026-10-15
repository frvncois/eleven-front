import type { Metadata } from "next";
import site from "@/data/site.json";
import { Chrome } from "@/components/shell/Chrome";
import { ContactLink } from "@/components/ui/ContactLink";
import { MiniLink } from "@/components/ui/MiniLink";
import { ToggleButterfly } from "@/components/ui/ToggleButterfly";

export const metadata: Metadata = { title: "Contact" };

const tel = (n: string) => `tel:+1${n.replace(/\D/g, "")}`;

/** V1 · 10 · Contact (Figma 7345:1649). One screen: title, the "hear" gif, contacts in the 600 column, footer row. */
export default function ContactPage() {
  const { contact, footer } = site;
  const [jordan, adrea] = contact.people;
  return (
    <main className="relative h-[max(var(--vh),1024px)] bg-neutral-0">

      <h1 className="t-h2-indent absolute top-[149px] left-[32px] w-[822px]">{contact.title}</h1>

      <div className="absolute top-[280px] left-[24px] flex w-[348px] justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/contact/rihanna-hear.gif" alt="" width={480} height={265} className="h-[265px] w-[480px] max-w-none object-cover" />
      </div>

      <address className="not-italic">
        <div className="absolute top-[434px] left-[637px] flex flex-col gap-1">
          <p className="t-h5">{jordan.name}</p>
          <p className="t-h5 whitespace-pre">{jordan.role}</p>
          <ContactLink href={`mailto:${jordan.email}`}>{jordan.email}</ContactLink>
          {jordan.phone && <ContactLink href={tel(jordan.phone)}>{jordan.phone}</ContactLink>}
        </div>

        <div className="absolute top-[556px] left-[637px] flex flex-col gap-1 pt-3">
          <p className="t-h5">{adrea.name}</p>
          <p className="t-h5">{adrea.role}</p>
          <ContactLink href={`mailto:${adrea.email.replace(/[[\]]/g, "")}`}>{adrea.email}</ContactLink>
        </div>

        <div className="absolute top-[689px] left-[637px] flex w-[332px] flex-col gap-1 pt-3">
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
        <p className="t-mini absolute bottom-[22px] left-[263.5px]">{footer.copyright}</p>
        <MiniLink href={footer.legal[0].href} className="absolute bottom-[38px] left-[637px]">
          {footer.legal[0].label}
        </MiniLink>
        <MiniLink href={footer.legal[1].href} className="absolute bottom-[23px] left-[637px]">
          {footer.legal[1].label}
        </MiniLink>
        <MiniLink href={footer.credits.href} className="absolute bottom-[23px] left-[845.5px]">
          {footer.credits.label}
        </MiniLink>
        <MiniLink href={footer.social[0].href} className="absolute bottom-[39px] left-[1080.5px]">
          {footer.social[0].label}
        </MiniLink>
        <MiniLink href={footer.social[1].href} className="absolute bottom-[23px] left-[1080.5px]">
          {footer.social[1].label}
        </MiniLink>
      </footer>

      <Chrome toggles={<ToggleButterfly />} />
    </main>
  );
}
