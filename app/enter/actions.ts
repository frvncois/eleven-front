"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_DAYS, createSessionToken, getSecret, safeEqual } from "@/lib/auth";

export type EnterState = { error: boolean };

/** Only same-origin paths are allowed as a return target. */
function safeNext(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function enter(_prev: EnterState, formData: FormData): Promise<EnterState> {
  const expected = process.env.PRESENTATION_PASSWORD;
  if (!expected) throw new Error("PRESENTATION_PASSWORD is not set. See .env.example.");

  const given = String(formData.get("password") ?? "").trim();

  if (!safeEqual(given, expected)) {
    // Small fixed delay blunts brute force without needing a store.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { error: true };
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(getSecret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  redirect(safeNext(formData.get("next")));
}
