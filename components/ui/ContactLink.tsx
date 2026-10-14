/** Link/Contact: Heading/H5 link (mail, phone, map), hover 50 % with a 0.15 s dissolve. */
export function ContactLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = /^https?:/.test(href);
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="t-h5 block transition-opacity duration-150 ease-out hover:opacity-50"
    >
      {children}
    </a>
  );
}
