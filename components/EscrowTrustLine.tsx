"use client";

import { LockIcon } from "@phosphor-icons/react/dist/csr/Lock";

export const ESCROW_TRUST_COPY = "Purchases are paused. No payment is taken or held.";

type EscrowTrustLineProps = {
  compact?: boolean;
  className?: string;
};

export default function EscrowTrustLine({ compact = false, className = "" }: EscrowTrustLineProps) {
  return (
    <p
      className={[
        "flex items-start gap-1.5 text-slate",
        compact ? "text-[14px] leading-5" : "text-[14px] leading-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <LockIcon
        size={compact ? 14 : 16}
        weight="regular"
        className="mt-0.5 shrink-0 text-eyebrow"
        aria-hidden="true"
      />
      <span>{ESCROW_TRUST_COPY}</span>
    </p>
  );
}
