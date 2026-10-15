'use client';

import Link from 'next/link';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Pick = { id: string; title: string; price_ngn: number };
const KEY = 'middleman-shortlist-v1';
const ShortlistContext = createContext<{ picks: Pick[]; toggle: (pick: Pick) => void; notice: string }>({ picks: [], toggle: () => {}, notice: '' });

export function ShortlistProvider({ children }: { children: ReactNode }) {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      if (Array.isArray(stored)) setPicks(stored.filter((item): item is Pick => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.price_ngn === 'number' && Number.isFinite(item.price_ngn) && item.price_ngn > 0).slice(0, 4));
    } catch { /* Browsing works without device storage. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(picks)); }
    catch { setNotice('Saved for this visit. Device storage is unavailable.'); }
  }, [picks, ready]);
  function toggle(pick: Pick) {
    if (picks.some(item => item.id === pick.id)) {
      setPicks(current => current.filter(item => item.id !== pick.id));
      setNotice('Removed from your shortlist.');
    } else if (picks.length >= 4) setNotice('Your shortlist has four products. Remove one to save another.');
    else { setPicks(current => [...current, pick]); setNotice('Added to your shortlist. No account needed.'); }
  }
  return <ShortlistContext.Provider value={{ picks, toggle, notice }}>{children}</ShortlistContext.Provider>;
}

export function SaveProductButton({ product }: { product: Pick }) {
  const { picks, toggle } = useContext(ShortlistContext);
  const saved = picks.some(item => item.id === product.id);
  return <button type="button" aria-pressed={saved} aria-label={`${saved ? 'Remove' : 'Save'} ${product.title}${saved ? ' from' : ' to'} shortlist`} onClick={() => toggle(product)} className={`save-product inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-xs font-semibold ${saved ? 'bg-[#f8dfc8] text-[#843c16]' : 'bg-white/95 text-[#3c4c59] hover:bg-[#fff0e2]'}`}><svg aria-hidden="true" width="15" height="17" viewBox="0 0 18 20" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"><path d="M4 2h10v15l-5-3-5 3V2Z" /></svg>{saved ? 'Saved' : 'Save'}</button>;
}

export function ShortlistPanel() {
  const { picks, toggle, notice } = useContext(ShortlistContext);
  const [open, setOpen] = useState(false);
  const prices = picks.map(item => item.price_ngn);
  const format = (price: number) => `₦${price.toLocaleString('en-NG')}`;
  return <aside aria-label="Your product shortlist" className="mt-5 rounded-xl border border-[#e7d5c3] bg-[#fffaf3] p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-[#23384b]">Your shortlist {picks.length > 0 && <span className="text-[#a94b18]">· {picks.length}/4</span>}</h2><p className="mt-1 text-sm text-[#716456]">Save a few products and compare before creating an account.</p></div><button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="shortlist-products" className="min-h-11 rounded-full border border-[#d7c2ad] px-4 text-sm font-semibold text-[#8b431d]">{open ? 'Close shortlist' : 'Open shortlist'}</button></div>
    <p role="status" aria-live="polite" className="mt-2 text-xs text-[#74685c]">{notice || 'Saved on this browser. Prices are confirmed again at checkout.'}</p>
    {open && <div id="shortlist-products" className="shortlist-content mt-4 border-t border-[#eadbcb] pt-4">{picks.length === 0 ? <p className="text-sm text-slate">Use Save on a product card to start your shortlist.</p> : <><ul className="grid gap-3 sm:grid-cols-2">{picks.map(pick => <li key={pick.id} className="flex items-start justify-between gap-3 rounded-lg bg-white p-3"><div className="min-w-0"><Link href={`/gigs/${pick.id}`} className="text-sm font-semibold text-[#263c50] hover:underline">{pick.title}</Link><p className="mt-1 text-sm text-[#a94b18]">{format(pick.price_ngn)}</p></div><button type="button" onClick={() => toggle(pick)} aria-label={`Remove ${pick.title} from shortlist`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#786b5f] hover:bg-[#f7eee5]">×</button></li>)}</ul>{picks.length > 1 && <p className="mt-4 text-sm text-[#66594c]">Your picks range from {format(Math.min(...prices))} to {format(Math.max(...prices))}. Compare the included files and requirements as well as the price.</p>}</>}</div>}
  </aside>;
}
