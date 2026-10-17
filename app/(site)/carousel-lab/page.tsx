import type { Metadata } from "next";
import { mixerBySlug, spotsOf } from "@/lib/content";
import { CarouselLab } from "@/components/lab/CarouselLab";

export const metadata: Metadata = { title: "Carousel lab" };

/** Exploration page, not linked from the nav: the mixer carousel along the wordmark's vanishing point. */
export default function Page() {
  return <CarouselLab mixer={mixerBySlug("jordan-meltzer")!} spots={spotsOf("jordan-meltzer")} />;
}
