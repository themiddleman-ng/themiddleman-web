"use client";

import { useState } from "react";

function Star({ filled, half, size }: { filled: boolean; half?: boolean; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#F26419" : "none"} stroke="#F26419" strokeWidth="1.5">
      {half && (
        <defs>
          <linearGradient id="half-star">
            <stop offset="50%" stopColor="#F26419" />
            <stop offset="50%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      <path
        fill={half ? "url(#half-star)" : filled ? "#F26419" : "none"}
        d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
      />
    </svg>
  );
}

// Read-only: shows an average out of 5, with a review count.
export function StarRatingDisplay({
  average,
  count,
  size = 14,
}: {
  average: number;
  count: number;
  size?: number;
}) {
  if (!count) {
    return <span className="text-[11px] text-[#8C8C8C]">No reviews yet</span>;
  }
  const rounded = Math.round(average * 2) / 2;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={size} filled={rounded >= n} half={rounded + 0.5 === n} />
        ))}
      </span>
      <span className="text-[11px] text-[#8C8C8C]">
        {average.toFixed(1)} ({count})
      </span>
    </span>
  );
}

// Interactive: click to pick 1-5, used in the review form.
export function StarRatingInput({
  value,
  onChange,
  size = 24,
}: {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
          className="p-0.5"
        >
          <Star size={size} filled={(hovered || value) >= n} />
        </button>
      ))}
    </div>
  );
}
