import site from "@/data/site.json";
import { MiniLink } from "@/components/ui/MiniLink";
import { CreditsPopover } from "@/components/ui/CreditsPopover";

/** The phone's footer (Contact and Legal, like desktop's FooterLinks), two columns: © + Legal + Credits | the socials. */
export function FooterMobile({ className = "" }: { className?: string }) {
  const { footer } = site;
  return (
    <footer className={`grid grid-cols-2 gap-x-gutter gap-y-3 px-margin ${className}`}>
      <div className="flex flex-col items-start gap-3">
        <p className="t-mini">{footer.copyright}</p>
        <MiniLink href={footer.legal[0].href}>{footer.legal[0].label}</MiniLink>
        <CreditsPopover label={footer.credits.label} items={footer.credits.items} />
      </div>
      <div className="flex flex-col items-start gap-3">
        {footer.social.map((s) => (
          <MiniLink key={s.label} href={s.href}>
            {s.label}
          </MiniLink>
        ))}
      </div>
    </footer>
  );
}
