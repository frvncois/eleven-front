import site from "@/data/site.json";
import { MiniLink } from "@/components/ui/MiniLink";
import { CreditsPopover } from "@/components/ui/CreditsPopover";

/**
 * The footer line (Contact, V2 · 10 · Contact · 9-col 7684:2720): © col 2, Privacy col 3, Credits col 4, LinkedIn and
 * Instagram side by side on col 6, every text on SOUND / OFF's baseline (21.8 above the bottom of its container).
 * Shared by Contact (one screen) and the end of Privacy (review note 17, Oct 23). Absolutely placed: the parent is
 * the positioned box whose bottom is the line.
 */
const L = {
  copyright: "bottom-[21.8px] left-col-2",
  privacy: "bottom-[21.8px] left-col-3",
  credits: "bottom-[21.8px] left-col-4",
  social: "bottom-[21.8px] left-col-6",
};

export function FooterLinks() {
  const { footer } = site;
  const social = (label: string) => footer.social.find((x) => x.label === label)!;
  return (
    <>
      <p className={`t-mini absolute ${L.copyright}`}>{footer.copyright}</p>
      <MiniLink href={footer.legal[0].href} className={`absolute ${L.privacy}`}>
        {footer.legal[0].label}
      </MiniLink>
      <CreditsPopover label={footer.credits.label} items={footer.credits.items} className={`absolute ${L.credits}`} />
      <div className={`absolute flex gap-gutter ${L.social}`}>
        <MiniLink href={social("LinkedIn").href}>{social("LinkedIn").label}</MiniLink>
        <MiniLink href={social("Instagram").href}>{social("Instagram").label}</MiniLink>
      </div>
    </>
  );
}
