import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
import { defaultOgCard, gigOgCard } from "@/lib/og/cards";
import { loadPublicGigCard } from "@/lib/og/public-gig";

export const alt = "The Middleman";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

const MAX_BYTES = 280_000;

async function logoSrc() {
  const file = await readFile(path.join(process.cwd(), "public/brand/app-icon.png"));
  return `data:image/png;base64,${file.toString("base64")}`;
}

function mimeFor(file: string) {
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

async function coverSrc(cover: string | null) {
  if (!cover) return null;
  try {
    const bytes = cover.startsWith("/")
      ? await readFile(path.join(process.cwd(), "public", cover.replace(/^\//, "")))
      : Buffer.from(await (await fetch(cover)).arrayBuffer());
    const mime = mimeFor(cover.split("?")[0]);
    if (mime === "image/webp" || bytes.byteLength > 250_000) return null;
    return `data:${mime};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

async function ogFonts() {
  const dir = path.join(process.cwd(), "lib/og/fonts");
  const [regular, bold] = await Promise.all([
    readFile(path.join(dir, "og-sans-regular.ttf")),
    readFile(path.join(dir, "og-sans-bold.ttf")),
  ]);
  return [
    { name: "Noto Sans", data: regular.buffer.slice(regular.byteOffset, regular.byteOffset + regular.byteLength), weight: 400 as const, style: "normal" as const },
    { name: "Noto Sans", data: bold.buffer.slice(bold.byteOffset, bold.byteOffset + bold.byteLength), weight: 700 as const, style: "normal" as const },
  ];
}

async function pngBytes(element: ReactElement) {
  const response = new ImageResponse(element, { ...size, fonts: await ogFonts() });
  return Buffer.from(await response.arrayBuffer());
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const logo = await logoSrc().catch(() => null);
  const gig = await loadPublicGigCard(id);
  const headers = { "Content-Type": "image/png" };
  if (!gig) return new Response(await pngBytes(defaultOgCard(logo)), { headers });

  const cover = await coverSrc(gig.cover);
  if (cover) {
    try {
      const bytes = await pngBytes(gigOgCard(gig, logo, cover));
      if (bytes.byteLength <= MAX_BYTES) return new Response(bytes, { headers });
    } catch (error) {
      console.error("Could not draw the gig cover on the share image.", error instanceof Error ? error.message : "unknown");
    }
  }
  return new Response(await pngBytes(gigOgCard(gig, logo, null)), { headers });
}
