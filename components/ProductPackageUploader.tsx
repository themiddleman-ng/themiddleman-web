"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { productFileType, uploadProductPackage } from "@/lib/client/product-packages";

function fileSize(bytes: number) {
  return bytes < 1024 * 1024
    ? Math.max(1, Math.round(bytes / 1024)) + " KB"
    : (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

type Stage = "preparing" | "uploading" | "checking" | "complete" | "";
type Version = { id: string; version_number: number; review_status: string; review_notes?: string | null };

function StageLabel({ stage }: { stage: Stage }) {
  if (stage === "preparing") return "Preparing private upload…";
  if (stage === "uploading") return "Uploading securely…";
  if (stage === "checking") return "Checking package contents…";
  if (stage === "complete") return "Submitted for review";
  return "";
}

export function ProductPackageField({ file, onChange, required = true }: { file: File | null; onChange: (file: File | null) => void; required?: boolean }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  function choose(candidate: File | null) {
    setError("");
    if (!candidate) return;
    try { productFileType(candidate); onChange(candidate); }
    catch (cause) { onChange(null); setError(cause instanceof Error ? cause.message : "Choose a supported product file."); }
  }

  return (
    <section className="rounded-xl border border-line bg-paper/40 p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-bone">Product file {required ? <span className="text-ember">*</span> : null}</h2>
          <p className="mt-1 text-sm text-slate">Upload the actual files buyers receive after purchase. This file stays private until review approves it.</p>
        </div>
        <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate">10 MB max</span>
      </div>
      <p className="mb-4 text-xs leading-5 text-slate">
        Code, templates and collections: upload a ZIP. Single documents or images can be uploaded as PDF, PNG or JPG; TXT is supported. Remove .git, .env files, credentials and private keys first. Executables are not accepted.
      </p>
      <label
        className={"relative block w-full overflow-hidden rounded-lg border border-dashed px-4 py-5 text-left transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-ember " + (dragging ? "border-ember bg-ember/10" : "border-white/15 bg-ink/30 hover:border-white/30")}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files?.[0] || null); }}
      >
      <input
        ref={inputRef}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        type="file"
        accept=".zip,.pdf,.png,.jpg,.jpeg,.txt,application/zip,application/pdf,image/png,image/jpeg,text/plain"
        aria-label="Choose a product file"
        onChange={(event) => choose(event.target.files?.[0] || null)}
      />
        {file ? (
          <span className="flex min-w-0 items-center justify-between gap-4">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-bone">{file.name}</span>
              <span className="mt-1 block text-xs text-slate">{fileSize(file.size)} · {file.name.split(".").pop()?.toUpperCase()}</span>
            </span>
            <span className="text-xs font-medium text-ember">Replace</span>
          </span>
        ) : (
          <span>
            <span className="block text-sm font-medium text-bone">Drop the product file here or choose a file</span>
            <span className="mt-1 block text-xs text-slate">ZIP, PDF, PNG, JPG or TXT · up to 10 MB</span>
          </span>
        )}
      </label>
      {file ? <button type="button" onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ""; }} className="mt-2 text-xs text-slate underline underline-offset-2 hover:text-bone">Remove file</button> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}

export default function ProductPackageManager({ gigId, compact = false, onComplete }: { gigId: string; compact?: boolean; onComplete?: () => void | Promise<void> }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/gigs/" + gigId + "/package", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Could not load product package status."); setLoading(false); return; }
    setVersions(result.versions || []);
    setCurrentVersionId(result.currentVersionId || null);
    setError("");
    setLoading(false);
  }, [gigId]);

  useEffect(() => { void load(); }, [load]);

  async function submit() {
    if (!file) { setError("Choose a product file to upload."); return; }
    setError("");
    try {
      await uploadProductPackage(gigId, file, supabase, setStage);
      setFile(null);
      setStage("complete");
      await load();
      onComplete?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The package upload did not finish.");
      setStage("");
    }
  }

  const current = versions.find((version) => version.id === currentVersionId);
  const latest = versions[0];

  return (
    <section className={"rounded-xl border border-line bg-ink/40 " + (compact ? "mt-4 p-4" : "p-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-bone">Product package</h3>
          <p className="mt-1 text-xs text-slate">
            {loading ? "Loading package status…" : current ? "Current version v" + current.version_number + " · approved" : latest ? "Latest version v" + latest.version_number + " · " + latest.review_status.split("_").join(" ") : "No product package submitted yet"}
          </p>
        </div>
        {current ? <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">Live</span> : null}
      </div>
      <div className="mt-3">
        <ProductPackageField file={file} onChange={setFile} required={false} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" disabled={!file || Boolean(stage && stage !== "complete")} onClick={submit} className="rounded-full bg-ember px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50">
          {stage && stage !== "complete" ? <StageLabel stage={stage} /> : current ? "Submit a new version" : "Upload and submit"}
        </button>
        {stage === "complete" ? <span className="text-xs text-emerald-300">Submitted for review.</span> : null}
      </div>
      {latest?.review_notes ? <p className="mt-3 text-xs text-slate">Review note: {latest.review_notes}</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
