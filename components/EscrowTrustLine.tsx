export const ESCROW_TRUST_COPY = "Payment held in escrow until you confirm delivery";

type EscrowTrustLineProps = {
  compact?: boolean;
  className?: string;
};

export default function EscrowTrustLine({ compact = false, className = "" }: EscrowTrustLineProps) {
  return (
    <p
      className={[
        "flex items-start gap-1.5 text-slate",
        compact ? "text-[11px] leading-4" : "text-[13px] leading-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className={compact ? "mt-px h-3.5 w-3.5 shrink-0 text-ember" : "mt-px h-4 w-4 shrink-0 text-ember"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M12 3 5.5 6.2v5.4c0 4.1 2.7 7.8 6.5 8.9 3.8-1.1 6.5-4.8 6.5-8.9V6.2L12 3Z" strokeLinejoin="round" />
        <path d="m9.2 12.1 1.9 1.9 3.7-3.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{ESCROW_TRUST_COPY}</span>
    </p>
  );
}
