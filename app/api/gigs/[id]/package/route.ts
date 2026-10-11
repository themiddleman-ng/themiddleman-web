import { createHash, randomUUID } from "node:crypto";
import {
  authenticatedUser,
  privateJson,
  serviceClient,
  uuidPattern,
} from "@/lib/server/marketplace";
import { productPackagesEnabled } from "@/lib/server/product-package-config.mjs";
import { inspectPackage } from "@/lib/server/package-validation.mjs";
import { sameOriginMutation } from "@/lib/server/same-origin.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "product-packages";
const MAX_BYTES = 10 * 1024 * 1024;
const MIME_BY_EXTENSION: Record<string, string> = {
  zip: "application/zip",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  txt: "text/plain",
};
function isPackagePath(gigId: string, path: string) {
  const parts = path.split("/");
  return parts.length === 3 &&
    parts[0] === gigId &&
    uuidPattern.test(parts[1]) &&
    /^package[.](zip|pdf|png|jpg|jpeg|txt)$/.test(parts[2]);
}

function safeFilename(input: unknown) {
  if (typeof input !== "string") return null;
  const value = input.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!value || value.length > 255) return null;
  return value;
}

async function sellerContext(gigId: string) {
  const user = await authenticatedUser();
  if (!user) return { response: privateJson({ error: "Sign in to manage product files." }, 401) };
  const db = serviceClient();
  if (!db) return { response: privateJson({ error: "Product files are not configured." }, 503) };
  const { data: seller, error: sellerError } = await db
    .from("seller_profiles")
    .select("id,verification_status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (sellerError) return { response: privateJson({ error: "Could not check your seller account." }, 500) };
  if (!seller || seller.verification_status !== "approved")
    return { response: privateJson({ error: "Approved seller access is required." }, 403) };
  const { data: gig, error: gigError } = await db
    .from("gigs")
    .select("id,status,current_product_version_id")
    .eq("id", gigId)
    .eq("seller_id", seller.id)
    .maybeSingle();
  if (gigError) return { response: privateJson({ error: "Could not load this product." }, 500) };
  if (!gig) return { response: privateJson({ error: "Product not found." }, 404) };
  if (!["draft", "pending_review", "changes_requested", "rejected", "active"].includes(gig.status))
    return { response: privateJson({ error: "This product cannot accept a package in its current state." }, 409) };
  return { user, db, seller, gig };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!productPackagesEnabled()) return privateJson({ error: "Product package uploads are not enabled here." }, 404);
  const { id } = await params;
  if (!uuidPattern.test(id)) return privateJson({ error: "Invalid product." }, 400);
  const context = await sellerContext(id);
  if ("response" in context) return context.response;
  const { data, error } = await context.db.from("product_versions")
    .select("id,version_number,original_filename,content_type,file_size,sha256,security_status,review_status,uploaded_at,reviewed_at,review_category,review_notes,is_current,access_status")
    .eq("gig_id", id)
    .order("version_number", { ascending: false });
  if (error) return privateJson({ error: "Could not load product package status." }, 500);
  return privateJson({ versions: data ?? [], currentVersionId: context.gig.current_product_version_id });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!productPackagesEnabled()) return privateJson({ error: "Product package uploads are not enabled here." }, 404);
  if (!sameOriginMutation(request)) return privateJson({ error: "Invalid request origin." }, 403);
  const { id } = await params;
  if (!uuidPattern.test(id)) return privateJson({ error: "Invalid product." }, 400);
  const context = await sellerContext(id);
  if ("response" in context) return context.response;

  let body: {
    intent?: unknown;
    filename?: unknown;
    contentType?: unknown;
    fileSize?: unknown;
    storagePath?: unknown;
  };
  try { body = await request.json(); }
  catch { return privateJson({ error: "Invalid request." }, 400); }

  if (body.intent === "sign") {
    const filename = safeFilename(body.filename);
    const extension = filename?.split(".").pop()?.toLowerCase() || "";
    const expectedType = MIME_BY_EXTENSION[extension];
    const fileSize = Number(body.fileSize);
    if (!filename || !expectedType || body.contentType !== expectedType)
      return privateJson({ error: "Use a ZIP, PDF, PNG, JPG, JPEG or plain text file." }, 400);
    if (!Number.isSafeInteger(fileSize) || fileSize < 1 || fileSize > MAX_BYTES)
      return privateJson({ error: "Product files must be 1 byte to 10 MB." }, 400);

    const versionId = randomUUID();
    const path = id + "/" + versionId + "/package." + extension;
    const { data, error } = await context.db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data?.token) return privateJson({ error: "Could not prepare a private upload." }, 500);
    return privateJson({ path, token: data.token, versionId }, 201);
  }

  if (body.intent === "abort") {
    if (typeof body.storagePath !== "string") return privateJson({ error: "Invalid upload path." }, 400);
    const path = body.storagePath;
    const parts = path.split("/");
    if (!isPackagePath(id, path))
      return privateJson({ error: "Invalid upload path." }, 400);
    const { data: existing, error: lookupError } = await context.db.from("product_versions")
      .select("id").eq("storage_path", path).maybeSingle();
    if (lookupError) return privateJson({ error: "Could not check upload state." }, 500);
    if (existing) return privateJson({ error: "A submitted product version cannot be removed here." }, 409);
    const { error } = await context.db.storage.from(BUCKET).remove([path]);
    return error ? privateJson({ error: "Could not remove the incomplete upload." }, 500) : privateJson({ removed: true });
  }

  if (body.intent !== "submit" || typeof body.storagePath !== "string")
    return privateJson({ error: "Unknown product file action." }, 400);

  const path = body.storagePath;
  const parts = path.split("/");
  if (!isPackagePath(id, path))
    return privateJson({ error: "Invalid upload path." }, 400);

  const { data: existingVersion, error: existingVersionError } = await context.db.from("product_versions")
    .select("id").eq("id", parts[1]).maybeSingle();
  if (existingVersionError) return privateJson({ error: "Could not check package version." }, 500);
  if (existingVersion) return privateJson({ error: "This product version was already submitted." }, 409);

  const { data: file, error: fileError } = await context.db.storage.from(BUCKET).info(path);
  if (fileError || !file || !Number.isSafeInteger(Number(file.size)) ||
      Number(file.size) < 1 || Number(file.size) > MAX_BYTES ||
      typeof file.contentType !== "string" || !Object.values(MIME_BY_EXTENSION).includes(file.contentType)) {
    await context.db.storage.from(BUCKET).remove([path]);
    return privateJson({ error: "Upload a supported product file under 10 MB." }, 400);
  }

  const extension = path.split(".").pop()?.toLowerCase() || "";
  const contentType = MIME_BY_EXTENSION[extension];
  if (file.contentType !== contentType) {
    await context.db.storage.from(BUCKET).remove([path]);
    return privateJson({ error: "The uploaded file type does not match its extension." }, 400);
  }

  const { data: uploaded, error: downloadError } = await context.db.storage.from(BUCKET).download(path);
  if (downloadError || !uploaded || uploaded.size > MAX_BYTES) {
    await context.db.storage.from(BUCKET).remove([path]);
    return privateJson({ error: "The uploaded package could not be inspected." }, 400);
  }

  let inspected;
  let packageBytes: Buffer;
  try {
    packageBytes = Buffer.from(await uploaded.arrayBuffer());
    inspected = await inspectPackage(packageBytes, contentType);
  } catch (cause) {
    await context.db.storage.from(BUCKET).remove([path]);
    return privateJson({
      error: cause instanceof Error ? cause.message : "The package did not pass structural checks.",
    }, 400);
  }
  if (inspected.size !== Number(file.size)) {
    await context.db.storage.from(BUCKET).remove([path]);
    return privateJson({ error: "Uploaded size does not match the inspected file." }, 400);
  }

  const report = {
    detectedType: inspected.detectedType,
    archive: inspected.archive ? {
      entryCount: inspected.archive.entryCount,
      fileCount: inspected.archive.fileCount,
      expandedSize: inspected.archive.expandedSize,
      paths: inspected.archive.paths.slice(0, 80).map((item) => item.slice(0, 240)),
      truncated: inspected.archive.truncated || inspected.archive.paths.length > 80,
    } : null,
    security: inspected.security,
  };
  const filename = safeFilename(body.filename) || ("product." + extension);
  if (filename.split(".").pop()?.toLowerCase() !== extension) {
    await context.db.storage.from(BUCKET).remove([path]);
    return privateJson({ error: "The original file name does not match the uploaded format." }, 400);
  }

  const { data, error } = await context.db.rpc("submit_product_version", {
    p_gig_id: id,
    p_seller_uid: context.user.id,
    p_version_id: parts[1],
    p_storage_path: path,
    p_original_filename: filename,
    p_content_type: contentType,
    p_file_size: inspected.size,
    p_sha256: createHash("sha256").update(packageBytes).digest("hex"),
    p_validation_report: report,
  });
  if (error || !data) {
    await context.db.storage.from(BUCKET).remove([path]);
    return privateJson({ error: "Could not submit this version for review." }, 409);
  }
  return privateJson(data, 201);
}
