import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { defaultOgCard, gigOgCard } from "@/lib/og/cards";
import { localPublicImage } from "@/lib/og/local-cover.mjs";
import { loadPublicGigCard } from "@/lib/og/public-gig";

export const alt = "The Middleman";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

const MAX_BYTES = 450_000;

async function logoSrc() {
  const file = await readFile(path.join(process.cwd(), "public/brand/app-icon.png"));
  return `data:image/png;base64,${file.toString("base64")}`;
}

async function coverSrc(cover: string | null) {
  const file = cover ? localPublicImage(cover) : null;
  if (!file) return null;
  try {
    const input = await readFile(file);
    const jpeg = await sharp(input, { failOn: "error", limitInputPixels: 8_000_000, pages: 1 })
      .rotate()
      .resize(480, 630, { fit: "contain", background: { r: 30, g: 30, b: 34, alpha: 1 } })
      .jpeg({ quality: 70 })
      .toBuffer();
    if (jpeg.byteLength > 180_000) return null;
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (error) {
    console.error("Could not prepare the local cover.", error instanceof Error ? error.message : "unknown");
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
      console.error("Share image with the cover was too large.", bytes.byteLength);
    } catch (error) {
      console.error("Could not draw the gig cover on the share image.", error instanceof Error ? error.message : "unknown");
    }
  }
  return new Response(await pngBytes(gigOgCard(gig, logo, null)), { headers });
}
