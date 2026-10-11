"use client";

import Link from "next/link";

const ITEMS = [
  { label: "Web & Software", href: "/marketplace?category=development" },
  { label: "Design", href: "/marketplace?category=design" },
  { label: "Writing", href: "/marketplace?category=writing" },
  { label: "Marketing", href: "/marketplace?category=marketing" },
  { label: "AI-assisted", href: "/marketplace?category=ai_assisted" },
  { label: "Templates", href: "/marketplace?q=templates" },
  { label: "Digital Products", href: "/marketplace" },
  { label: "Business", href: "/marketplace?q=business" },
];

export default function CategoryMarquee() {
  const loop = [...ITEMS, ...ITEMS];

  return (
    <section className="overflow-hidden bg-[#F6F1E8] py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <p className="mb-7 text-center text-xs font-medium tracking-[0.02em] text-[#7A746D] sm:text-sm">
          Explore the marketplace
        </p>
      </div>

      <div className="group relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#F6F1E8] to-transparent sm:w-28"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#F6F1E8] to-transparent sm:w-28"
        />

        <div className="tm-marquee flex w-max min-w-full items-center gap-8 whitespace-nowrap px-4 group-hover:[animation-play-state:paused] sm:gap-12">
          {loop.map((item, index) => (
            <Link
              key={`${item.label}-${index}`}
              href={item.href}
              aria-hidden={index >= ITEMS.length}
              tabIndex={index >= ITEMS.length ? -1 : 0}
              className="inline-flex items-center gap-3 text-lg font-medium tracking-[-0.02em] text-[#49515F] transition-colors hover:text-[#0B3D91] sm:text-xl"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF8A00]" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .tm-marquee {
          animation: tm-marquee-scroll 34s linear infinite;
          will-change: transform;
        }

        @keyframes tm-marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .tm-marquee {
            animation: none;
            transform: none;
            flex-wrap: wrap;
            width: auto;
            justify-content: center;
            white-space: normal;
            padding-inline: 1.25rem;
          }

          .tm-marquee > :nth-child(n + 9) {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
