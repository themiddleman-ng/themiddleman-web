import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { defaultOgCard } from "@/lib/og/cards";

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

export const alt = "The Middleman — Nigerian digital products marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function Image() {
  let logo: string | null = null;
  try {
    const file = await readFile(path.join(process.cwd(), "public/brand/app-icon.png"));
    logo = `data:image/png;base64,${file.toString("base64")}`;
  } catch {
    logo = null;
  }
  return new ImageResponse(defaultOgCard(logo), { ...size, fonts: await ogFonts() });
}
