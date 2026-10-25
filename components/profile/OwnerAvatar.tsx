"use client";

import { useEffect, useState } from "react";

export function ownerInitials(name?: string | null, email?: string | null) {
  const source = (name?.trim() || email?.trim() || "MM");
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.slice(0, 2) || "MM").toUpperCase();
}

export default function OwnerAvatar({
  url,
  name,
  email,
  size = 40,
  className = "",
}: {
  url?: string;
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  const showPhoto = Boolean(url) && !failed;

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-paper font-bold leading-none text-muted ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.32)) }}
    >
      {showPhoto ? (
        // Signed storage URLs and local previews are not Next image hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{ownerInitials(name, email)}</span>
      )}
    </span>
  );
}
