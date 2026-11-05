"use client";

import site from "@/data/site.json";
import { ContactLink } from "@/components/ui/ContactLink";
import { ToggleButterfly } from "@/components/ui/ToggleButterfly";
import { FooterMobile } from "./FooterMobile";
import { useDockToggle } from "./dock";

// US numbers, written with or without the leading +1.
const tel = (n: string) => {
  const d = n.replace(/\D/g, "");
  return `tel:+${d.length === 11 ? d : `1${d}`}`;
};

/**
 * Contact on a phone. The line in serif 28 (Junicode), the
 * gif edge to edge (text keeps the margin), then Studio / Jordan / Adrea / the two reps stacked 32 apart
 * (a REP label over each rep), every email and phone a real mailto: / tel: link. Footer in two columns. The butterfly takes the dock's top-right
 * slot and still starts the animal party.
 */
export function ContactMobile() {
  const { contact } = site;
  const [jordan, adrea] = contact.people;
  const { reps } = contact;
  useDockToggle(<ToggleButterfly />, true);

  return (
    <main className="bg-neutral-0 pt-[150px] pb-[150px]">
      <h1 className="px-margin font-serif text-[28px] leading-none" style={{ textIndent: "var(--grid-step)" }}>
        {contact.title}
      </h1>

      <div className="mt-10 h-[216px] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/contact/steve-brule.gif" alt="Dr. Steve Brule holding a microphone" width={390} height={216} className="size-full object-cover" />
      </div>

      <address className="mt-10 flex flex-col gap-8 px-margin not-italic">
        <div className="flex flex-col gap-1">
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
        <div className="flex flex-col gap-1">
          <p className="t-h5">{jordan.name}</p>
          <p className="t-h5 whitespace-pre">{jordan.role}</p>
          <ContactLink href={`mailto:${jordan.email}`}>{jordan.email}</ContactLink>
          {jordan.phone && <ContactLink href={tel(jordan.phone)}>{jordan.phone}</ContactLink>}
        </div>
        <div className="flex flex-col gap-1">
          <p className="t-h5">{adrea.name}</p>
          <p className="t-h5">{adrea.role}</p>
          <ContactLink href={`mailto:${adrea.email.replace(/[[\]]/g, "")}`}>{adrea.email}</ContactLink>
        </div>
        {reps.people.map((r) => (
          <div key={r.email} className="flex flex-col gap-1">
            <p className="t-h6">{reps.label}</p>
            <p className="t-h5">{r.name}</p>
            <ContactLink href={`mailto:${r.email}`}>{r.email}</ContactLink>
            <ContactLink href={tel(r.phone)}>{r.phone}</ContactLink>
          </div>
        ))}
      </address>

      <FooterMobile className="mt-20" />
    </main>
  );
}
