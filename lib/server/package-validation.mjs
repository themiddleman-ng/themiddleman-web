import { createHash } from "node:crypto";
import yauzl from "yauzl";

export const MAX_PACKAGE_BYTES = 10 * 1024 * 1024;
const MAX_EXPANDED = 100 * 1024 * 1024;
const MAX_ENTRIES = 5000;
const CRC_TABLE = Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++)
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

export function validateArchivePath(name, externalAttributes = 0) {
  const normalized = name.normalize("NFKC").replaceAll("\\", "/");
  const parts = normalized.toLowerCase().split("/");
  if (
    !normalized ||
    normalized.startsWith("/") ||
    /^[a-z]:/i.test(normalized) ||
    /[\x00-\x1f]/.test(normalized) ||
    parts.includes("..") ||
    parts.includes(".") ||
    parts.some(
      (part) => part.replace(/[. ]+$/, "") === ".git" || part === ".git",
    ) ||
    ((externalAttributes >>> 16) & 0xf000) === 0xa000
  ) {
    throw new Error(
      "ZIP contains a Git directory, unsafe path or symbolic link.",
    );
  }
  if (
    parts.some(
      (part) =>
        /^\.env($|\.)/.test(part) && !/\.(example|sample|template)$/.test(part),
    ) ||
    parts.some(
      (part) =>
        ["id_rsa", "id_ed25519"].includes(part) ||
        /\.(p12|pfx|key)$/.test(part),
    )
  ) {
    throw new Error(
      "Remove environment secrets and private keys from the package.",
    );
  }
  return normalized.toLowerCase();
}

export async function inspectPackage(bytes, contentType) {
  const buffer = Buffer.from(bytes);
  if (!buffer.length || buffer.length > MAX_PACKAGE_BYTES)
    throw new Error("Package must be 1 byte to 10 MB.");
  if (contentType === "application/zip") {
    await new Promise((resolve, reject) => {
      yauzl.fromBuffer(
        buffer,
        { lazyEntries: true, validateEntrySizes: true },
        (error, zip) => {
          if (error || !zip) {
            reject(new Error("Invalid ZIP archive."));
            return;
          }
          let entries = 0,
            total = 0;
          const names = new Set();
          const fail = (error) => {
            zip.close();
            reject(error);
          };
          zip.on("error", fail);
          zip.on("end", () =>
            entries ? resolve() : reject(new Error("ZIP is empty.")),
          );
          zip.on("entry", (entry) => {
            try {
              const name = validateArchivePath(
                entry.fileName,
                entry.externalFileAttributes,
              );
              const offset = entry.relativeOffsetOfLocalHeader;
              if (
                offset + 30 > buffer.length ||
                buffer.readUInt32LE(offset) !== 0x04034b50
              )
                throw new Error("Invalid ZIP local header.");
              const localNameLength = buffer.readUInt16LE(offset + 26);
              const localName = buffer
                .subarray(offset + 30, offset + 30 + localNameLength)
                .toString("utf8");
              if (localName !== entry.fileName)
                throw new Error("ZIP entry names disagree.");
              if (
                ++entries > MAX_ENTRIES ||
                names.has(name) ||
                entry.generalPurposeBitFlag & 1
              )
                throw new Error(
                  "ZIP has too many entries, duplicate paths or encryption.",
                );
              names.add(name);
              if (
                entry.uncompressedSize > MAX_EXPANDED ||
                total + entry.uncompressedSize > MAX_EXPANDED
              )
                throw new Error("ZIP expands beyond the 100 MB limit.");
              if (entry.fileName.endsWith("/")) {
                zip.readEntry();
                return;
              }
              zip.openReadStream(entry, (error, stream) => {
                if (error || !stream) {
                  fail(new Error("Invalid ZIP entry."));
                  return;
                }
                let size = 0,
                  crc = 0xffffffff;
                stream.on("data", (chunk) => {
                  for (const byte of chunk)
                    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
                  size += chunk.length;
                  total += chunk.length;
                  if (total > MAX_EXPANDED) {
                    stream.destroy();
                    fail(new Error("ZIP expands beyond the 100 MB limit."));
                  }
                });
                stream.on("error", fail);
                stream.on("end", () => {
                  if (
                    size !== entry.uncompressedSize ||
                    (crc ^ 0xffffffff) >>> 0 !== entry.crc32
                  )
                    fail(new Error("ZIP entry integrity mismatch."));
                  else zip.readEntry();
                });
              });
            } catch (cause) {
              fail(cause);
            }
          });
          zip.readEntry();
        },
      );
    });
  } else if (
    contentType === "application/pdf" &&
    buffer.subarray(0, 5).toString() !== "%PDF-"
  ) {
    throw new Error("Invalid PDF.");
  } else if (
    contentType === "image/png" &&
    buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a"
  ) {
    throw new Error("Invalid PNG.");
  } else if (
    contentType === "image/jpeg" &&
    buffer.subarray(0, 3).toString("hex") !== "ffd8ff"
  ) {
    throw new Error("Invalid JPEG.");
  } else if (
    ![
      "application/zip",
      "application/pdf",
      "image/png",
      "image/jpeg",
      "text/plain",
    ].includes(contentType)
  ) {
    throw new Error("Unsupported package type.");
  }
  return {
    sha256: createHash("sha256").update(buffer).digest("hex"),
    size: buffer.length,
  };
}
