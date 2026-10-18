import { categoryTheme } from "@/lib/marketplace/categories";

function CategoryIcon({ category, className }: { category: string; className?: string }) {
  if (category === "design") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M12 3.5 20.5 12 12 20.5 3.5 12 12 3.5Z" />
      </svg>
    );
  }
  if (category === "marketing") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M4 16V8l10-3v14L4 16Z" strokeLinejoin="round" />
        <path d="M14 9.5h4.5L20 7v10l-1.5-2.5H14" strokeLinejoin="round" />
      </svg>
    );
  }
  if (category === "writing") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M6 20h12M8 4h5.5a3.5 3.5 0 0 1 0 7H8v9" strokeLinecap="round" />
      </svg>
    );
  }
  if (category === "ai_assisted") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M12 3.5 13.6 9h5.9L14.8 12.6 16.5 18 12 14.8 7.5 18l1.7-5.4L4.5 9h5.9L12 3.5Z" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M8 8.5h3.8L8.6 16H6.4L9.2 8.5H8V7h6v1.5h-2.2L8.8 16H7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.2 16V8.5L18.4 16V8.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function categoryCover(category: string) {
  return categoryTheme(category);
}

export default function ProductCover({
  title,
  category,
  compact = false,
  label,
}: {
  title: string;
  category: string;
  compact?: boolean;
  label?: string;
}) {
  const theme = categoryTheme(category);
  const shownLabel = label ?? theme.label;
  return (
    <div
      className="product-cover relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{ ["--tile-accent" as string]: `var(--accent-${theme.accent})` }}
      role="img"
      aria-label={`${title} cover`}
    >
      <CategoryIcon category={category} className={compact ? "h-10 w-10" : "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]"} />
      <span className="product-cover-label absolute left-2.5 top-2.5 inline-flex items-center rounded-full bg-paper/80 px-2 py-0.5 text-[13px] font-semibold leading-5">
        {shownLabel}
      </span>
    </div>
  );
}
