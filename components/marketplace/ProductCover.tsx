const CATEGORY_COVERS: Record<
  string,
  { label: string; bg: string; fg: string; accent: string; panel: string }
> = {
  development: {
    label: "Web & Software",
    bg: "#1F3347",
    fg: "#F7F1E8",
    accent: "#E8893A",
    panel: "rgba(247,241,232,.12)",
  },
  design: {
    label: "Design",
    bg: "#E8C4A8",
    fg: "#1F3347",
    accent: "#9A3412",
    panel: "rgba(31,51,71,.08)",
  },
  marketing: {
    label: "Marketing",
    bg: "#E8A15A",
    fg: "#1F3347",
    accent: "#7C2D12",
    panel: "rgba(31,51,71,.10)",
  },
  writing: {
    label: "Writing",
    bg: "#C9D7C4",
    fg: "#1F3347",
    accent: "#3D5A40",
    panel: "rgba(31,51,71,.08)",
  },
  ai_assisted: {
    label: "AI-assisted",
    bg: "#EFE4D4",
    fg: "#1F3347",
    accent: "#9A3412",
    panel: "rgba(154,52,18,.10)",
  },
};

function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const stroke = "currentColor";
  if (category === "design") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" aria-hidden="true">
        <path d="M12 3.5 20.5 12 12 20.5 3.5 12 12 3.5Z" />
      </svg>
    );
  }
  if (category === "marketing") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" aria-hidden="true">
        <path d="M4 16V8l10-3v14L4 16Z" strokeLinejoin="round" />
        <path d="M14 9.5h4.5L20 7v10l-1.5-2.5H14" strokeLinejoin="round" />
      </svg>
    );
  }
  if (category === "writing") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" aria-hidden="true">
        <path d="M6 20h12M8 4h5.5a3.5 3.5 0 0 1 0 7H8v9" strokeLinecap="round" />
      </svg>
    );
  }
  if (category === "ai_assisted") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" aria-hidden="true">
        <path d="M12 3.5 13.6 9h5.9L14.8 12.6 16.5 18 12 14.8 7.5 18l1.7-5.4L4.5 9h5.9L12 3.5Z" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" aria-hidden="true">
      <path d="M7 8.5h4.2L8.4 16h-2L9 8.5H7V7h6.5v1.5H11.3L8.5 16H7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 16V8.5L18.5 16V8.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function categoryCover(category: string) {
  return CATEGORY_COVERS[category] ?? {
    label: "Digital product",
    bg: "#EFE4D4",
    fg: "#1F3347",
    accent: "#9A3412",
    panel: "rgba(31,51,71,.08)",
  };
}

export default function ProductCover({
  title,
  category,
  compact = false,
}: {
  title: string;
  category: string;
  compact?: boolean;
}) {
  const theme = categoryCover(category);
  return (
    <div
      className={`relative flex h-full w-full overflow-hidden ${compact ? "p-3" : "p-4 sm:p-5"}`}
      style={{ background: theme.bg, color: theme.fg }}
      role="img"
      aria-label={`${title} cover`}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full opacity-40"
        style={{ background: theme.panel }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-4 h-24 w-24 rounded-full opacity-30"
        style={{ background: theme.panel }}
        aria-hidden="true"
      />
      <div
        className="relative flex h-full w-full flex-col justify-between rounded-lg"
        style={{ background: theme.panel }}
      >
        <div className={`flex items-center justify-between ${compact ? "px-2.5 pt-2.5" : "px-3.5 pt-3.5"}`}>
          <span
            className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-[.14em] ${compact ? "text-[9px]" : "text-[10px]"}`}
            style={{ color: theme.accent }}
          >
            <CategoryIcon category={category} className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            {theme.label}
          </span>
        </div>
        <p
          className={`line-clamp-3 font-display font-semibold leading-tight tracking-[-.03em] ${compact ? "px-2.5 pb-2.5 text-[13px]" : "px-3.5 pb-3.5 text-[15px] sm:text-[17px]"}`}
        >
          {title}
        </p>
      </div>
    </div>
  );
}
