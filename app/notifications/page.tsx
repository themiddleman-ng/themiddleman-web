"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";

type Notification = {
  id: string;
  source: "system" | "admin" | "order";
  notification_type: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  action_required: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load notifications.");
      setItems(result.notifications || []);
      setUnreadCount(result.unreadCount || 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load notifications.");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) throw new Error("Could not mark this notification as read.");
    window.dispatchEvent(new Event("notifications:updated"));
    await load();
  }

  async function openItem(item: Notification) {
    try {
      if (!item.read_at) await markRead(item.id);
      router.push(item.href || "/orders");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open this notification.");
    }
  }

  async function markAllRead() {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "all" }),
    });
    if (!response.ok) { setError("Could not mark notifications as read."); return; }
    window.dispatchEvent(new Event("notifications:updated"));
    await load();
  }

  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-5 py-8 sm:px-7">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="text-xs font-semibold tracking-[.14em] text-ember">YOUR ACCOUNT</p>
            <h1 className="mt-2 font-display text-3xl font-bold">Notifications</h1>
            <p className="mt-2 text-sm text-slate">{unreadCount} unread</p>
          </div>
          {unreadCount > 0 ? <button onClick={markAllRead} className="rounded-full border border-line px-4 py-2 text-xs text-slate hover:text-bone">Mark all read</button> : null}
        </header>

        {loading ? <p className="mt-7 text-sm text-slate">Loading notifications…</p> : null}
        {error ? <p role="alert" className="mt-7 text-sm text-red-300">{error}</p> : null}
        {!loading && !items.length ? <p className="mt-7 text-sm text-slate">You’re all caught up. Important product and order updates will appear here.</p> : null}

        <div className="mt-6 divide-y divide-white/10">
          {items.map((item) => (
            <button key={item.id} onClick={() => openItem(item)} className={"block w-full py-5 text-left " + (!item.read_at ? "border-l-2 border-ember pl-4" : "pl-[18px]")}>
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{item.title}</span>
                {!item.read_at ? <span className="rounded-full bg-ember/10 px-2 py-0.5 text-[10px] text-ember">Unread</span> : null}
                {item.action_required ? <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate">Action needed</span> : null}
              </span>
              <span className="mt-1 block text-sm leading-6 text-slate">{item.body}</span>
              <span className="mt-2 block text-[11px] text-slate/70">
                {item.source === "admin" ? "The Middleman Support" : "The Middleman"} · {new Date(item.created_at).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
