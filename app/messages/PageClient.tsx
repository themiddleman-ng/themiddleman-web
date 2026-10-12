"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import SiteHeader from "@/components/SiteHeader";

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
    <div className="w-9 h-9 shrink-0 rounded-full bg-white border border-line flex items-center justify-center font-display font-bold text-xs text-bone shadow-sm">
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
      onClick={onClick}
      className={
        "w-full text-left px-4 py-3.5 flex gap-3 border-l-2 transition-colors " +
        (active
          ? "border-ember bg-ember/8"
          : "border-transparent hover:bg-white/80")
      }
    >
      <Avatar initials={conversation.counterpartInitials} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-bone truncate">
          {conversation.counterpartName}
        </p>
        <p className="text-[11px] text-slate">
          {conversation.gigTitle ?? "General inquiry"}
        </p>
      </div>
    </button>
  );
}

function MessageEntry({ isYou, senderName, message }: { isYou: boolean; senderName: string; message: MessageRow }) {
  return (
    <div className={"max-w-[75%] " + (isYou ? "ml-auto text-right" : "")}>
      <div className={"flex items-baseline gap-2 mb-1 " + (isYou ? "justify-end" : "")}>
        <span className="text-[12px] font-medium text-bone">{senderName}</span>
        <span className="text-[11px] text-slate">{formatTime(message.created_at)}</span>
      </div>
      <p className="text-[13px] text-bone leading-relaxed">{message.body}</p>
    </div>
  );
}

function MessagesPageInner() {
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get("conversation");
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
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
        if (!cancelled) {
          setLoadError("Sign in to view your messages.");
          setLoading(false);
        }
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
  }, [requestedConversationId]);

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
    setWarning(null);
    const refreshed = await fetch(`/api/conversations/${activeId}/messages`, { cache: 'no-store' });
    if (refreshed.ok) setMessages((await refreshed.json()).messages);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex min-h-[100svh] flex-col bg-[radial-gradient(circle_at_top_right,_rgba(242,100,25,.08),_transparent_35%),linear-gradient(180deg,#fbf8f3,#f7f3ec)] text-bone">
      <SiteHeader />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col md:px-6">

        <div className="border-b border-line px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-[#23384d] sm:text-[1.75rem]">Messages</h1>
            <p className="mt-1 text-[13px] text-slate">Conversations about your orders and products</p>
          </div>
        </div>

        {!noticeDismissed && (
          <div className="flex items-start gap-3 border-b border-line bg-white/75 px-4 py-3 backdrop-blur-sm sm:px-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6F6A63" strokeWidth="2" className="mt-0.5 shrink-0">
              <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
            <p className="text-[12px] text-slate leading-relaxed flex-1">
              For your safety and to resolve disputes fairly, The Middleman may review conversations tied to an order. Please keep messages related to the product — links, phone numbers, and email addresses can&apos;t be sent here.
            </p>
            <button
              onClick={() => setNoticeDismissed(true)}
              aria-label="Dismiss notice"
              className="text-slate hover:text-bone text-[13px] shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-slate">Loading conversations…</p>
          </div>
        )}

        {!loading && loadError && (
          <div className="flex-1 flex items-center justify-center px-6">
            <p className="text-sm text-slate text-center max-w-md">
              {loadError}
              {loadError.includes("relation") && (
                <> This usually means <code className="text-[#F26419]">supabase/messages_schema.sql</code> hasn&apos;t been run against your project yet.</>
              )}
            </p>
          </div>
        )}

        {!loading && !loadError && conversations.length === 0 && (
          <div className="flex-1 flex items-center justify-center px-6">
            <p className="text-sm text-slate text-center max-w-sm">
              No conversations yet. Once you order a product or a buyer reaches out about one of yours, it&apos;ll show up here.
            </p>
          </div>
        )}

        {!loading && !loadError && conversations.length > 0 && activeConversation && (
          <div className="flex flex-1 min-h-0 overflow-hidden">

            <div className={`${mobileThreadOpen ? "hidden" : "flex"} w-full shrink-0 flex-col overflow-y-auto bg-white/60 md:flex md:w-[300px] md:border-r md:border-line`}>
              {conversations.map((conversation) => (
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
            </div>

            <div className={`${mobileThreadOpen ? "flex" : "hidden"} min-w-0 flex-1 flex-col md:flex`}>
              <div className="flex items-center gap-3 border-b border-line bg-white/70 px-4 py-3 sm:px-6 sm:py-4">
                <button type="button" onClick={() => setMobileThreadOpen(false)} aria-label="Back to conversations" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#516170] hover:bg-[#f4eee6] md:hidden">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /><path d="M9 12h12" /></svg>
                </button>
                <Avatar initials={activeConversation.counterpartInitials} />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-bone">
                    {activeConversation.counterpartName}
                  </p>
                  <p className="truncate text-[11px] text-slate">
                    Re: {activeConversation.gigTitle ?? "General inquiry"}
                  </p>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,255,255,.40),rgba(255,255,255,.70))] px-4 py-5 sm:px-6 sm:py-6">
                <div className="flex min-h-full flex-col gap-5">
                {messages.map((message) => (
                  <MessageEntry
                    key={message.id}
                    message={message}
                    isYou={message.mine}
                    senderName={message.mine ? "You" : activeConversation.counterpartName}
                  />
                ))}
                {otherTyping && (
                  <div className="flex items-center gap-2">
                    <Avatar initials={activeConversation.counterpartInitials} />
                    <div className="flex items-center gap-1 rounded-full bg-white border border-line px-3 py-2 shadow-sm">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                )}
                </div>
              </div>

              <div className="border-t border-line bg-white/90 px-3 py-3 sm:px-5 sm:py-4">
                {warning && (
                  <p className="text-[12px] text-ember mb-2">{warning}</p>
                )}
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => handleDraftChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Write a message about this product"
                    className="flex-1 bg-transparent border-0 border-b border-line text-sm text-bone placeholder-slate py-1.5 focus:outline-none focus:border-ember"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim()}
                    className="w-9 h-9 shrink-0 rounded-full bg-ember flex items-center justify-center shadow-md shadow-ember/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Send message"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C1B18" strokeWidth="2">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPageInner />
    </Suspense>
  );
}

