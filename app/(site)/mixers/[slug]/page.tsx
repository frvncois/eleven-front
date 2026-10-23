import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mixers, mixerBySlug, spotsOf } from "@/lib/content";
import { MixerPage } from "@/components/mixers/MixerPage";
import { MixerMobile } from "@/components/mobile/MixerMobile";
import { ByDevice } from "@/components/mobile/ByDevice";

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
  const spots = spotsOf(slug);
  return <ByDevice desktop={<MixerPage mixer={mixer} spots={spots} />} phone={<MixerMobile mixer={mixer} spots={spots} />} />;
}
