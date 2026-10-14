import type { Metadata } from "next";
import { EnterForm } from "./EnterForm";

export const metadata: Metadata = { title: "Enter" };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function EnterPage({ searchParams }: Props) {
  const { next } = await searchParams;
  return <EnterForm next={next ?? "/"} />;
}
