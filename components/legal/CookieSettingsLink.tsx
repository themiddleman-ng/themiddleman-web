"use client";

export default function CookieSettingsLink({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("middleman:cookies-open"))}
      className={className}
    >
      Cookie settings
    </button>
  );
}
