"use client";

import { useEffect, useState } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";

export const SIGNED_IN_FLAG = "mm_signed_in";

export function markSignedIn() {
  try {
    sessionStorage.setItem(SIGNED_IN_FLAG, "1");
  } catch {
    /* Toast is optional when storage is blocked. */
  }
}

export default function SignedInToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SIGNED_IN_FLAG) !== "1") return;
      sessionStorage.removeItem(SIGNED_IN_FLAG);
    } catch {
      return;
    }
    setVisible(true);
    const hide = window.setTimeout(() => setVisible(false), 4200);
    return () => window.clearTimeout(hide);
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex justify-center px-4 md:top-5">
      <p
        role="status"
        aria-live="polite"
        className="mm-signed-in-toast flex items-center gap-2 rounded-full bg-[#172b45] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(23,43,69,.28)]"
      >
        <CheckCircleIcon size={18} weight="fill" className="text-[#8ee0a8]" aria-hidden="true" />
        Signed in successfully
      </p>
    </div>
  );
}
