import { FileIcon } from "@phosphor-icons/react/dist/csr/File";
import { FilePdfIcon } from "@phosphor-icons/react/dist/csr/FilePdf";
import { FileXlsIcon } from "@phosphor-icons/react/dist/csr/FileXls";
import { FileZipIcon } from "@phosphor-icons/react/dist/csr/FileZip";
import { ImageIcon } from "@phosphor-icons/react/dist/csr/Image";

export type FileKind = "pdf" | "spreadsheet" | "zip" | "image" | "text" | "other";

export function fileKindFromName(name: string, contentType?: string): FileKind {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf") || contentType === "application/pdf") return "pdf";
  if (/\.(xlsx|xls|csv)$/.test(lower) || contentType?.includes("spreadsheet")) return "spreadsheet";
  if (lower.endsWith(".zip") || contentType === "application/zip") return "zip";
  if (/\.(png|jpe?g|webp|gif)$/.test(lower) || contentType?.startsWith("image/")) return "image";
  if (lower.endsWith(".txt") || contentType === "text/plain") return "text";
  return "other";
}

export default function FileTypeIcon({
  kind,
  size = 22,
  className = "",
}: {
  kind: FileKind;
  size?: number;
  className?: string;
}) {
  const shell =
    "grid shrink-0 place-items-center rounded-lg border border-line bg-paper " +
    (className || "h-11 w-11");

  if (kind === "pdf") {
    return (
      <span className={shell} aria-hidden="true">
        <FilePdfIcon size={size} weight="regular" className="text-red-600" />
      </span>
    );
  }
  if (kind === "spreadsheet") {
    return (
      <span className={shell} aria-hidden="true">
        <FileXlsIcon size={size} weight="regular" className="text-emerald-600" />
      </span>
    );
  }
  if (kind === "zip") {
    return (
      <span className={shell} aria-hidden="true">
        <FileZipIcon size={size} weight="regular" className="text-slate" />
      </span>
    );
  }
  if (kind === "image") {
    return (
      <span className={shell} aria-hidden="true">
        <ImageIcon size={size} weight="regular" className="text-slate" />
      </span>
    );
  }
  return (
    <span className={shell} aria-hidden="true">
      <FileIcon size={size} weight="regular" className="text-slate" />
    </span>
  );
}
