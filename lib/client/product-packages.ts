import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BYTES = 10 * 1024 * 1024;
const TYPES: Record<string, string> = {
  zip: "application/zip",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  txt: "text/plain",
};

export type PackageStage = "preparing" | "uploading" | "checking" | "complete";

export function productFileType(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const contentType = TYPES[extension];
  if (!contentType) throw new Error("Choose a ZIP, PDF, PNG, JPG, JPEG or TXT file.");
  if (!file.size || file.size > MAX_BYTES) throw new Error("Product files must be 1 byte to 10 MB.");
  return contentType;
}

export async function uploadProductPackage(
  gigId: string,
  file: File,
  supabase: SupabaseClient,
  onStage?: (stage: PackageStage) => void,
) {
  const contentType = productFileType(file);
  onStage?.("preparing");
  const signedResponse = await fetch("/api/gigs/" + gigId + "/package", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intent: "sign", filename: file.name, contentType, fileSize: file.size }),
  });
  const signed = await signedResponse.json();
  if (!signedResponse.ok) throw new Error(signed.error || "Could not prepare a private upload.");

  onStage?.("uploading");
  const { error: uploadError } = await supabase.storage
    .from("product-packages")
    .uploadToSignedUrl(signed.path, signed.token, file, { contentType });
  if (uploadError) {
    await fetch("/api/gigs/" + gigId + "/package", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "abort", storagePath: signed.path }),
    });
    throw new Error(uploadError.message || "The package upload did not finish.");
  }

  onStage?.("checking");
  const submittedResponse = await fetch("/api/gigs/" + gigId + "/package", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intent: "submit", filename: file.name, storagePath: signed.path }),
  });
  const submitted = await submittedResponse.json();
  if (!submittedResponse.ok) {
    await fetch("/api/gigs/" + gigId + "/package", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "abort", storagePath: signed.path }),
    });
    throw new Error(submitted.error || "The package could not be submitted for review.");
  }
  onStage?.("complete");
  return submitted;
}
