"use client";

import { classifyAvatarFile, guessImageType } from "@/lib/profile/avatar-file.mjs";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("decode"));
    image.src = src;
  });
}

async function canvasJpeg(source: CanvasImageSource, width: number, height: number) {
  const canvas = document.createElement("canvas");
  const max = 1600;
  const scale = Math.min(1, max / Math.max(width, height));
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("jpeg");
  return blob;
}

export async function prepareAvatarFile(file: File, maxBytes = 3 * 1024 * 1024): Promise<
  | { ok: true; file: File; type: string; previewUrl: string }
  | { ok: false; code: string; message: string }
> {
  const check = classifyAvatarFile(file, maxBytes);
  if (!check.ok) return { ok: false, code: check.code || "type", message: check.message || "Choose a JPG, PNG or a photo from your camera roll." };

  const previewUrl = URL.createObjectURL(file);
  const type = check.type || guessImageType(file) || "image/jpeg";

  if (!check.needsConvert && ["image/jpeg", "image/png", "image/webp"].includes(type)) {
    return { ok: true as const, file, type, previewUrl };
  }

  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(file);
      const blob = await canvasJpeg(bitmap, bitmap.width, bitmap.height);
      bitmap.close();
      return { ok: true as const, file: new File([blob], "avatar.jpg", { type: "image/jpeg" }), type: "image/jpeg", previewUrl };
    }
    const image = await loadImage(previewUrl);
    const blob = await canvasJpeg(image, image.naturalWidth, image.naturalHeight);
    return { ok: true as const, file: new File([blob], "avatar.jpg", { type: "image/jpeg" }), type: "image/jpeg", previewUrl };
  } catch {
    URL.revokeObjectURL(previewUrl);
    return {
      ok: false as const,
      code: "decode",
      message: "This phone photo couldn’t be read. Save it as a JPG and try again.",
    };
  }
}
