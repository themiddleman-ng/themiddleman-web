"use client";

import { useEffect, useRef, useState } from "react";
import { CopyIcon } from "@phosphor-icons/react/dist/csr/Copy";
import { ShareNetworkIcon } from "@phosphor-icons/react/dist/csr/ShareNetwork";
import { WhatsappLogoIcon } from "@phosphor-icons/react/dist/csr/WhatsappLogo";
import { productShareUrl, whatsappShareHref } from "@/lib/share/product-link.mjs";

export default function ProductShareMenu({ productId, title }: { productId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const url = productShareUrl(productId);

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function shareNatively() {
    setOpen(false);
    try {
      await navigator.share({ title, url });
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setNotice("Couldn't open the share sheet.");
    }
  }

  async function copyLink() {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Link copied.");
    } catch {
      setNotice(url);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="Share product"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="grid h-11 w-11 place-items-center rounded-full text-bone hover:bg-elevated"
      >
        <ShareNetworkIcon size={22} weight="regular" aria-hidden="true" />
      </button>
      {open ? (
        <div role="menu" aria-label="Share product" className="absolute right-0 top-12 z-20 min-w-44 rounded-xl border border-line bg-paper p-1.5 shadow-lg">
          {canNativeShare ? (
            <button type="button" role="menuitem" onClick={() => void shareNatively()} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-bone hover:bg-elevated">
              <ShareNetworkIcon size={18} aria-hidden="true" /> Share
            </button>
          ) : null}
          <a role="menuitem" href={whatsappShareHref(title, url)} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-bone hover:bg-elevated">
            <WhatsappLogoIcon size={18} aria-hidden="true" /> WhatsApp
          </a>
          <button type="button" role="menuitem" onClick={() => void copyLink()} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-bone hover:bg-elevated">
            <CopyIcon size={18} aria-hidden="true" /> Copy link
          </button>
        </div>
      ) : null}
      {notice ? <p role="status" className="absolute right-0 top-12 z-20 max-w-xs rounded-lg bg-paper px-3 py-2 text-xs text-bone shadow">{notice}</p> : null}
    </div>
  );
}
