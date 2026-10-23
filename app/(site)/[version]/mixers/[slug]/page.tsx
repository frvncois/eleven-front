import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mixers, mixerBySlug, spotsOf } from "@/lib/content";
import { MixerPage } from "@/components/mixers/MixerPage";

export const dynamicParams = false;

export function generateStaticParams() {
  return mixers.map((m) => ({ slug: m.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: mixerBySlug(slug)?.name ?? "Mixer" };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const mixer = mixerBySlug(slug);
  if (!mixer) notFound();
  return <MixerPage mixer={mixer} spots={spotsOf(slug)} />;
}
