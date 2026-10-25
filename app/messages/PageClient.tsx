"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import SiteHeader from "@/components/SiteHeader";
import { signinHref } from "@/lib/auth/signin-redirect.mjs";
import DraftRestoredNotice from "@/components/forms/DraftRestoredNotice";
import { usePersistedForm } from "@/lib/forms/usePersistedForm";

// Design note: message threads use a calm correspondence layout with a
// sender, timestamp and message text separated by a thin rule.
//
// Platform rule: conversations are for coordinating a product or order.
// Links and contact details are blocked here; see
// containsRestrictedContent() and the matching server validation.
// This check runs here for instant feedback, and is enforced again by
// a check constraint on public.messages (see supabase/messages_schema.sql)
// since client-side validation alone can be bypassed.
//
// Data layer: reads/writes public.conversations and public.messages,
// with a realtime subscription so new messages appear without a
// manual refresh. Requires supabase/messages_schema.sql to have been
// run, and 'messages' added to the supabase_realtime publication.

type ConversationRow = {
  id: string;
  role: 'buyer' | 'seller';
  gig_id: string | null;
  lastReadAt: string | null;
  counterpartName: string;
  counterpartInitials: string;
  gigTitle: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  mine: boolean;
  body: string;
  created_at: string;
};

const URL_PATTERN = /(https?:\/\/|www\.)\S+/i;
const BARE_DOMAIN_PATTERN = /\b[a-z0-9-]+\.(com|net|org|ng|io|co|me|link)\b/i;
const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_PATTERN = /(\+?\d[\d\s-]{7,}\d)/;

function containsRestrictedContent(text: string): string | null {
  if (URL_PATTERN.test(text) || BARE_DOMAIN_PATTERN.test(text)) {
    return "Links can't be sent here. Share files through the order flow instead.";
  }
  if (EMAIL_PATTERN.test(text)) {
    return "Email addresses can't be shared in messages. Keep product conversations on The Middleman.";
  }
  if (PHONE_PATTERN.test(text)) {
    return "Phone numbers can't be shared in messages. Keep product conversations on The Middleman.";
  }
  return null;
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ember-cta font-display text-xs font-bold text-on-ember">
      {initials}
    </div>
  );
}

function ConversationRowItem({
  conversation,
  active,
  onClick,
}: {
  conversation: ConversationRow;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={`flex min-h-14 w-full gap-3 border-b border-line px-4 py-4 text-left transition-colors ${active ? "bg-elevated" : "hover:bg-ink"}`}
    >
      <Avatar initials={conversation.counterpartInitials} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-bone">
          {conversation.counterpartName}
        </p>
        <p className="mt-1 truncate text-[14px] text-slate">
          {conversation.gigTitle ?? "General inquiry"}
        </p>
      </div>
      {active && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ember-cta" aria-label="Selected conversation" />}
    </button>
  );
}

function MessageEntry({ isYou, senderName, message }: { isYou: boolean; senderName: string; message: MessageRow }) {
  return (
    <div className={`flex w-full items-end gap-2.5 ${isYou ? "justify-end" : "justify-start"}`}>
      {!isYou && <Avatar initials={initialsFrom(senderName)} />}
      <div className={`max-w-[82%] sm:max-w-[72%] ${isYou ? "items-end" : "items-start"}`}>
        <p className={`mb-1 px-1 text-[14px] font-medium text-slate ${isYou ? "text-right" : ""}`}>{senderName}</p>
        <div className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[16px] leading-6 ${isYou ? "rounded-br-md bg-elevated text-bone" : "rounded-bl-md bg-ink text-bone"}`}>
          {message.body}
        </div>
        <time className={`mt-1 block px-1 text-[14px] text-slate ${isYou ? "text-right" : ""}`} dateTime={message.created_at}>{formatTime(message.created_at)}</time>
      </div>
    </div>
  );
}

function MessagesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get("conversation");
  const [conversationQuery, setConversationQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [composerDraft, setComposerDraft] = useState({ body: "" });
  const {
    restored: composerDraftRestored,
    discardDraft: discardComposerDraft,
    clearDraft: clearComposerDraft,
  } = usePersistedForm({
    formId: "messages-compose",
    userId,
    recordId: activeId || "none",
    values: composerDraft,
    setValues: setComposerDraft,
    enabled: Boolean(userId && activeId),
    storage: "session",
  });
  const draft = composerDraft.body;
  const setDraft = (body: string) => setComposerDraft({ body });
  const [warning, setWarning] = useState<string | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  // Load the current user, then their conversations.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) router.replace(signinHref("/messages"));
        return;
      }
      if (!cancelled) setUserId(user.id);

      const response = await fetch('/api/conversations', { cache: 'no-store' });
      const result = await response.json();

      if (cancelled) return;

      if (!response.ok) {
        setLoadError(result.error || 'Could not load conversations.');
        setConversations([]);
        setLoading(false);
        return;
      }

      const rows: ConversationRow[] = (result.conversations ?? []).map((row: ConversationRow) => ({
        ...row, counterpartInitials: initialsFrom(row.counterpartName),
      }));

      setConversations(rows);
      const preferredId = requestedConversationId && rows.some((r) => r.id === requestedConversationId)
        ? requestedConversationId
        : rows[0]?.id ?? null;
      setActiveId(preferredId);
      setMobileThreadOpen(Boolean(requestedConversationId && preferredId === requestedConversationId));
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [requestedConversationId, router]);

  // Load messages for the active conversation, and subscribe to new ones.
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function loadMessages() {
      const response = await fetch(`/api/conversations/${activeId}/messages`, { cache: 'no-store' });
      if (response.ok && !cancelled) {
        const result = await response.json();
        setMessages((result.messages as MessageRow[]) ?? []);
      }
    }

    loadMessages();
    const refreshTimer = window.setInterval(loadMessages, 5000);

    // Separate ephemeral broadcast channel for the typing indicator — no
    // table, no rows written, so it costs nothing against the Supabase
    // free tier's row/storage limits.
    const typingChannel = supabase
      .channel(`typing:${activeId}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.role && payload.role !== activeConversation?.role) {
          setOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 2500);
        }
      })
      .subscribe();
    typingChannelRef.current = typingChannel;

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      supabase.removeChannel(typingChannel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setOtherTyping(false);
    };
  }, [activeId, activeConversation?.role]);

  // Mark conversation as read when the user opens it
  useEffect(() => {
    async function markAsRead() {
      if (!activeId || !userId) return;

      const conversation = conversations.find((c) => c.id === activeId);
      if (!conversation) return;

      const role = conversation.role;

      await supabase.rpc("mark_conversation_read", {
        p_conversation_id: activeId,
        p_role: role,
      });

      window.dispatchEvent(new Event("messages:read-updated"));
    }

    markAsRead();
  }, [activeId, userId, conversations]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, otherTyping]);

  function handleDraftChange(value: string) {
    setDraft(value);
    if (warning) setWarning(null);

    const now = Date.now();
    if (activeId && userId && now - lastTypingSentRef.current > 1500) {
      typingChannelRef.current?.send({ type: "broadcast", event: "typing", payload: { role: activeConversation?.role } });
      lastTypingSentRef.current = now;
    }
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || !activeId || !userId) return;

    const restriction = containsRestrictedContent(text);
    if (restriction) {
      setWarning(restriction);
      return;
    }

    const response = await fetch(`/api/conversations/${activeId}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      const result = await response.json();
      setWarning(result.error || 'Could not send message.');
      return;
    }

    setDraft("");
    clearComposerDraft();
    setWarning(null);
    const refreshed = await fetch(`/api/conversations/${activeId}/messages`, { cache: 'no-store' });
    if (refreshed.ok) setMessages((await refreshed.json()).messages);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <main className="flex min-h-[calc(100svh-4rem)] flex-col bg-ink text-bone">
      <SiteHeader hideOnMobile />
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-0 pb-4 md:px-6">
        <div className="flex items-end justify-between gap-3 px-4 py-4 sm:px-6 md:px-0 md:py-6">
          <div>
            <p className="text-[14px] font-medium text-eyebrow">Your conversations</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-[-.03em] text-bone sm:text-3xl">Messages</h1>
            <p className="mt-1 text-[16px] text-slate">Keep product conversations in one place.</p>
          </div>
          {!loading && !loadError && conversations.length > 0 && (
            <span className="mb-1 rounded-full bg-paper px-3 py-1.5 text-[14px] font-medium text-slate">
              {conversations.length} {conversations.length === 1 ? "conversation" : "conversations"}
            </span>
          )}
        </div>

        {!noticeDismissed && (
          <div className="mx-3 mb-3 flex items-start gap-3 rounded-2xl border border-line bg-elevated px-4 py-3 text-muted sm:mx-6 md:mx-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-ember-cta" strokeWidth="1.8" className="mt-0.5 shrink-0" aria-hidden="true">
              <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
            <p className="flex-1 text-[14px] leading-5 text-muted sm:text-xs sm:text-slate">
              Keep messages about the product. Links, phone numbers and email addresses are blocked to help protect order conversations.
            </p>
            <button type="button" onClick={() => setNoticeDismissed(true)} aria-label="Dismiss safety note" className="-mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm text-muted transition hover:bg-elevated hover:text-bone">
              ×
            </button>
          </div>
        )}

        {loading && (
          <div className="flex-1 overflow-hidden border-t border-line bg-ink p-4 sm:p-6" aria-label="Loading conversations">
            <div className="flex animate-pulse gap-4">
              <div className="h-11 w-11 rounded-full bg-elevated" />
              <div className="flex-1 space-y-2 pt-1"><div className="h-3 w-1/3 rounded bg-elevated" /><div className="h-3 w-2/3 rounded bg-elevated" /></div>
            </div>
            <div className="mt-6 h-px bg-line" />
            <div className="mt-6 h-14 w-3/5 animate-pulse rounded-2xl bg-elevated" />
            <div className="ml-auto mt-5 h-14 w-1/2 animate-pulse rounded-2xl bg-elevated" />
          </div>
        )}

        {!loading && loadError && (
          <div className="flex flex-1 items-center justify-center border-t border-line px-6 py-12 text-center">
            <div className="max-w-md">
              <p className="font-display text-xl font-semibold text-bone">We couldn’t load your messages</p>
              <p className="mt-2 text-[16px] leading-6 text-slate">{loadError}
                {loadError.includes("relation") && (
                  <> This may mean <code className="rounded bg-elevated px-1.5 py-0.5 text-[14px] text-eyebrow">supabase/messages_schema.sql</code> hasn’t been run against your project yet.</>
                )}
              </p>
            </div>
          </div>
        )}

        {!loading && !loadError && conversations.length === 0 && (
          <div className="flex flex-1 items-center justify-center border-t border-line px-6 py-12 text-center">
            <div className="max-w-sm">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-elevated text-eyebrow" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H3l1.8-3.6A8.5 8.5 0 1 1 21 11.5Z" /></svg>
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-bone">No conversations yet</h2>
              <p className="mt-2 text-[16px] leading-6 text-slate">Messages about a paid product order will appear here, so you and the creator can keep everything together.</p>
              <Link href="/marketplace" className="mt-4 inline-flex min-h-11 items-center rounded-full px-4 text-[16px] font-semibold text-eyebrow transition hover:bg-elevated">Explore products</Link>
            </div>
          </div>
        )}

        {!loading && !loadError && conversations.length > 0 && activeConversation && (
          <div className="flex min-h-[31rem] min-w-0 flex-1 overflow-hidden border-t border-line bg-ink">
            <section className={`${mobileThreadOpen ? "hidden" : "flex"} w-full shrink-0 flex-col overflow-y-auto md:flex md:w-[min(320px,38%)] md:max-w-sm md:border-r md:border-line`} aria-label="Conversation list">
              <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
                <h2 className="text-[16px] font-semibold text-bone">Inbox</h2>
                <span className="text-[14px] text-slate">{conversations.length}</span>
              </div>
              <input type="search" aria-label="Search conversations" placeholder="Search conversations" value={conversationQuery} onChange={(event) => setConversationQuery(event.target.value)} className="mx-3 mb-1 mt-3 min-h-11 w-[calc(100%-1.5rem)] rounded-lg border border-line px-3 text-[16px] text-bone placeholder:text-muted" />
              {conversations.filter((conversation) => `${conversation.counterpartName} ${conversation.gigTitle || ''}`.toLowerCase().includes(conversationQuery.trim().toLowerCase())).map((conversation) => (
                <ConversationRowItem
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === activeId}
                  onClick={() => {
                    setActiveId(conversation.id);
                    setDraft("");
                    setWarning(null);
                    setMobileThreadOpen(true);
                  }}
                />
              ))}
            </section>

            <section className={`${mobileThreadOpen ? "flex" : "hidden"} min-w-0 w-full flex-1 flex-col md:flex`} aria-label="Active conversation">
              <div className="flex min-h-[4.5rem] items-center gap-3 border-b border-line px-3 py-3 sm:px-5">
                <button type="button" onClick={() => setMobileThreadOpen(false)} aria-label="Back to conversations" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted transition hover:bg-elevated md:hidden">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <Avatar initials={activeConversation.counterpartInitials} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold text-bone">{activeConversation.counterpartName}</p>
                  <p className="truncate text-[14px] text-slate">{activeConversation.gigTitle ?? "Product conversation"}</p>
                </div>
                <span className="hidden rounded-full bg-elevated px-3 py-1.5 text-[14px] font-medium text-slate sm:inline-flex">Order conversation</span>
              </div>

              <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-ink px-3 py-5 sm:px-5 sm:py-6">
                <div className="flex min-h-full flex-col justify-end gap-4">
                  {messages.length === 0 && (
                    <p className="my-auto text-center text-[16px] text-slate">Your conversation starts here.</p>
                  )}
                  {messages.map((message) => (
                    <MessageEntry
                      key={message.id}
                      message={message}
                      isYou={message.mine}
                      senderName={message.mine ? "You" : activeConversation.counterpartName}
                    />
                  ))}
                  {otherTyping && (
                    <div className="flex items-end gap-2.5" aria-label="The other person is typing">
                      <Avatar initials={activeConversation.counterpartInitials} />
                      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-elevated px-3.5 py-3">
                        <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full min-w-0 border-t border-line bg-paper px-3 py-3 sm:px-5 sm:py-4">
                <DraftRestoredNotice
                  visible={composerDraftRestored}
                  onDiscard={() => {
                    discardComposerDraft();
                    setComposerDraft({ body: "" });
                  }}
                />
                {warning && <p role="alert" className="mb-2 rounded-xl bg-ember-cta/10 px-3 py-2 text-xs leading-5 text-link">{warning}</p>}
                <div className="flex w-full min-w-0 items-end gap-2 rounded-2xl border border-line bg-paper p-2 focus-within:border-link focus-within:ring-4 focus-within:ring-ember-cta/10">
                  <textarea
                    rows={1}
                    maxLength={2000}
                    value={draft}
                    onChange={(e) => handleDraftChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Write a message…"
                    aria-label="Write a message"
                    className="max-h-28 min-h-11 min-w-0 w-full flex-1 basis-0 resize-y border-0 bg-transparent px-2 py-2 text-[16px] leading-5 text-bone outline-none placeholder:text-muted"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!draft.trim()}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ember-cta text-white transition hover:bg-ember-hover disabled:cursor-not-allowed disabled:bg-elevated disabled:text-muted"
                    aria-label="Send message"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 3-7.2 18-3.9-7.9L2 9.2 21 3Z" /><path d="M21 3 9.9 13.1" /></svg>
                  </button>
                </div>
                <p className="mt-2 px-1 text-[14px] text-muted md:text-xs md:text-slate">Enter to send · Shift + Enter for a new line</p>
              </div>
            </section>
            <aside className="hidden w-60 shrink-0 border-l border-line p-6 xl:block" aria-label="Conversation details">
              <h2 className="text-sm font-semibold">Conversation details</h2>
              <p className="mt-6 text-[14px] text-slate">Product</p>
              <p className="mt-2 text-sm font-semibold">{activeConversation.gigTitle || 'Product conversation'}</p>
              {activeConversation.gig_id && <Link href={`/gigs/${activeConversation.gig_id}`} className="mt-5 block rounded-lg border border-line px-4 py-3 text-center text-sm font-medium">View product</Link>}
              <Link href="/orders" className="mt-3 flex min-h-11 items-center justify-center rounded-lg bg-ember-cta text-center text-sm font-semibold text-on-ember hover:bg-ember-hover">View your orders</Link>
              <p className="mt-6 text-[14px] leading-5 text-slate">Keep payments and delivery on The Middleman. Share files through the order flow.</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPageInner />
    </Suspense>
  );
}

