"use client";

import type { ReactNode } from "react";

export default function PhotoPicker({
  id,
  label,
  disabled,
  onFile,
  children,
}: {
  id: string;
  label: string;
  disabled?: boolean;
  onFile: (file: File) => void;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className={`relative inline-flex w-full overflow-hidden ${disabled ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
    >
      <input
        id={id}
        type="file"
        accept="image/*"
        disabled={disabled}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
      {children}
    </label>
  );
}
