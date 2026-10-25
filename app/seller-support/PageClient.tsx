"use client";

import { useCallback, useEffect, useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { InfoIcon } from "@phosphor-icons/react/dist/csr/Info";
import SiteHeader from "@/components/SiteHeader";
import { signinHref } from "@/lib/auth/signin-redirect.mjs";
import DraftRestoredNotice from "@/components/forms/DraftRestoredNotice";
import { usePersistedForm } from "@/lib/forms/usePersistedForm";

type Message = { id: string; sender_kind: "seller" | "admin" | "system"; body: string; created_at: string };
type Thread = { id: string; subject: string; status: "open" | "closed"; updated_at: string; messages: Message[] };

export default function SellerSupportPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState("");
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [replyDraft, setReplyDraft] = useState({ body: "" });
  const {
    restored: replyDraftRestored,
    discardDraft: discardReplyDraft,
    clearDraft: clearReplyDraft,
  } = usePersistedForm({
    formId: "seller-support-reply",
    recordId: activeId || "none",
    values: replyDraft,
    setValues: setReplyDraft,
    enabled: Boolean(activeId),
    storage: "session",
  });
  const reply = replyDraft.body;
  const setReply = (body: string) => setReplyDraft({ body });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(false);

  const activeThread = useMemo(() => threads.find((thread) => thread.id === activeId) ?? null, [threads, activeId]);

  useEffect(() => {
    if (mobileThreadOpen && !activeThread) setMobileThreadOpen(false);
  }, [activeThread, mobileThreadOpen]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setUnavailable(false);
    try {
      const response = await fetch("/api/seller/communications", { cache: "no-store" });
      if (response.status === 401) {
        router.replace(signinHref("/seller-support"));
        return;
      }
      if (response.status === 404) {
        setUnavailable(true);
        setThreads([]);
        setActiveId("");
        return;
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load Operations messages.");
      setThreads(result.threads ?? []);
      setActiveId((current) =>
        current && (result.threads ?? []).some((thread: Thread) => thread.id === current)
          ? current
          : result.threads?.[0]?.id ?? "",
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load Operations messages.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeThread || !reply.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/seller/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeThread.id, text: reply }),
      });
      if (response.status === 401) {
        router.replace(signinHref("/seller-support"));
        return;
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send your reply.");
      setReply("");
      clearReplyDraft();
      await load();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not send your reply.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8 md:py-12">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-ember">Seller support</p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Operations messages</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate">Private notes from The Middleman team about your seller account and product operations.</p>

        {unavailable && (
          <div role="status" className="mm-info-panel">
            <InfoIcon size={20} className="mt-0.5 shrink-0 text-slate" aria-hidden="true" />
            <p>{"Operations messages aren't available yet"}</p>
          </div>
        )}
        {error && !unavailable && <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
        {!unavailable && (
        <div className="mt-5 grid min-h-[28rem] gap-4 sm:mt-7 sm:min-h-[32rem] sm:gap-5 lg:grid-cols-[.7fr_1.3fr]">
          <aside className={`${mobileThreadOpen ? "hidden" : "block"} rounded-2xl border border-line bg-paper p-4 lg:block`}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Your conversations</h2>
              <button type="button" onClick={() => void load()} className="text-xs font-semibold text-ember hover:underline">Refresh</button>
            </div>
            {loading ? <p className="mt-4 text-sm text-slate">Loading…</p> : threads.length ? (
              <div className="mt-4 space-y-2">
                {threads.map((thread) => (
                  <button
                    type="button"
                    key={thread.id}
                    onClick={() => { setActiveId(thread.id); setMobileThreadOpen(true); }}
                    className={"w-full rounded-xl border p-3 text-left transition " + (thread.id === activeId ? "border-ember/50 bg-ember/8" : "border-line hover:border-slate")}
                  >
                    <span className="block truncate text-sm font-semibold">{thread.subject}</span>
                    <span className="mt-1 block text-xs capitalize text-slate">{thread.status} · {thread.messages.length} messages</span>
                  </button>
                ))}
              </div>
            ) : <p className="mt-4 text-sm leading-6 text-slate">No operations messages yet. If the team needs to contact you, the conversation will appear here.</p>}
          </aside>

          <section className={`${mobileThreadOpen ? "flex" : "hidden"} min-h-[28rem] min-w-0 flex-col rounded-2xl border border-line bg-paper sm:min-h-[32rem] lg:flex`}>
            {activeThread ? (
              <>
                <header className="flex items-start gap-3 border-b border-line px-4 py-3 sm:px-5 sm:py-4">
                  <button type="button" onClick={() => setMobileThreadOpen(false)} aria-label="Back to conversations" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate hover:bg-ink lg:hidden">←</button>
                  <div className="min-w-0">
                    <h2 className="break-words font-display text-lg font-semibold sm:text-xl">{activeThread.subject}</h2>
                  <p className="mt-1 text-xs capitalize text-slate">Seller account · {activeThread.status}</p>
                  </div>
                </header>
                <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
                  {activeThread.messages.map((message) => (
                    <article key={message.id} className="border-b border-dashed border-line pb-4">
                      <p className="text-xs text-slate">
                        {message.sender_kind === "seller" ? "You" : message.sender_kind === "admin" ? "The Middleman team" : "System update"}
                        <span className="ml-2">{new Date(message.created_at).toLocaleString()}</span>
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                    </article>
                  ))}
                </div>
                {activeThread.status === "open" ? (
                  <form onSubmit={sendReply} className="border-t border-line p-4 sm:p-5">
                    <DraftRestoredNotice
                      visible={replyDraftRestored}
                      onDiscard={() => {
                        discardReplyDraft();
                        setReplyDraft({ body: "" });
                      }}
                    />
                    <label className="block text-sm">
                      Reply
                      <textarea value={reply} onChange={(event) => setReply(event.target.value)} maxLength={5000} className="auth-input mt-2 min-h-24" placeholder="Write a reply to The Middleman team." />
                    </label>
                    <button disabled={busy || !reply.trim()} className="mt-3 rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-[#111111] disabled:opacity-50">
                      {busy ? "Sending…" : "Send reply"}
                    </button>
                  </form>
                ) : <p className="border-t border-line p-4 text-sm text-slate sm:p-5">This conversation is closed.</p>}
              </>
            ) : (
              <div className="grid flex-1 place-items-center p-8 text-center">
                <p className="max-w-sm text-sm leading-6 text-slate">{loading ? "Loading…" : "No conversation selected."}</p>
              </div>
            )}
          </section>
        </div>
        )}
      </div>
    </main>
  );
}

