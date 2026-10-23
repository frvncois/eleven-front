import { notFound } from "next/navigation";
import { VERSIONS } from "@/lib/versions";

export const dynamicParams = false;

export function generateStaticParams() {
  return VERSIONS.map((version) => ({ version }));
}

export default async function VersionLayout({ children, params }: { children: React.ReactNode; params: Promise<{ version: string }> }) {
  const { version } = await params;
  if (!(VERSIONS as readonly string[]).includes(version)) notFound();
  return children;
}
