"use client";

import { useEffect } from "react";

export default function SellerDirectoryFocus({ focusId }: { focusId: string | null }) {
  useEffect(() => {
    if (!focusId) return;
    const target = document.getElementById(`seller-${focusId}`);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusId]);

  return null;
}
