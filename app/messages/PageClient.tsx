"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import SiteHeader from "@/components/SiteHeader";

// Design note: message threads are rendered as correspondence entries
// (sender + timestamp, then message text, separated by a thin dashed
// rule) rather than colored chat bubbles. This keeps continuity with
// the marketplace's paper-trail language (escrow, receipts, tickets)
// instead of introducing an unrelated chat-app visual pattern.
//
// Platform rule: conversations here are for coordinating an active or
// prospective gig only. To keep every transaction inside escrow, we
// don't allow links or contact details (phone numbers, emails, social
// handles) to be shared in-thread — see containsRestrictedContent().
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
  buyer_id: string;
  seller_id: string;
  gig_id: string | null;
  buyer_last_read_at: string | null;
  seller_last_read_at: string | null;
  counterpartName: string;
  counterpartInitials: string;
  gigTitle: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
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
    return "Email addresses can't be shared in messages. Keep communication on The Middleman so your order stays protected.";
  }
  if (PHONE_PATTERN.test(text)) {
    return "Phone numbers can't be shared in messages. Keep communication on The Middleman so your order stays protected.";
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

      const { data, error } = await supabase
        .from("conversations")
        .select(
          "id, buyer_id, seller_id, gig_id, buyer_last_read_at, seller_last_read_at, gigs ( title ), buyer:users!conversations_buyer_id_fkey ( full_name ), seller:seller_profiles!conversations_seller_id_fkey ( display_name )"
        )
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

      if (cancelled) return;

      if (error) {
        setLoadError(error.message);
        setConversations([]);
        setLoading(false);
        return;
      }

      const rows: ConversationRow[] = (data ?? []).map((row: any) => {
        const isBuyer = row.buyer_id === user.id;
        const counterpartName = isBuyer
          ? row.seller?.display_name ?? "Seller"
          : row.buyer?.full_name ?? "Buyer";
        return {
          id: row.id,
          buyer_id: row.buyer_id,
          seller_id: row.seller_id,
          gig_id: row.gig_id,
          buyer_last_read_at: row.buyer_last_read_at ?? null,
          seller_last_read_at: row.seller_last_read_at ?? null,
          counterpartName,
          counterpartInitials: initialsFrom(counterpartName),
          gigTitle: row.gigs?.title ?? null,
        };
      });

      setConversations(rows);
      const preferredId = requestedConversationId && rows.some((r) => r.id === requestedConversationId)
        ? requestedConversationId
        : rows[0]?.id ?? null;
      setActiveId(preferredId);
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
      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, body, created_at")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true });

      if (!cancelled && !error) setMessages((data as MessageRow[]) ?? []);
    }

    loadMessages();

    const channel = supabase
      .channel(`messages:${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          setMessages((current) => [...current, payload.new as MessageRow]);
        }
      )
      .subscribe();

    // Separate ephemeral broadcast channel for the typing indicator — no
    // table, no rows written, so it costs nothing against the Supabase
    // free tier's row/storage limits.
    const typingChannel = supabase
      .channel(`typing:${activeId}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.userId && payload.userId !== userId) {
          setOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 2500);
        }
      })
      .subscribe();
    typingChannelRef.current = typingChannel;

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      supabase.removeChannel(typingChannel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setOtherTyping(false);
    };
  }, [activeId, userId]);

  // Mark conversation as read when the user opens it
  useEffect(() => {
    async function markAsRead() {
      if (!activeId || !userId) return;

      const conversation = conversations.find((c) => c.id === activeId);
      if (!conversation) return;

      const isBuyer = conversation.buyer_id === userId;
      const role = isBuyer ? "buyer" : "seller";

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
      typingChannelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId } });
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

    const { error } = await supabase.from("messages").insert({
      conversation_id: activeId,
      sender_id: userId,
      body: text,
    });

    if (error) {
      // The DB check constraint is the real backstop for restricted
      // content — if the client-side regex missed something, this
      // is where it actually gets rejected.
      setWarning(
        error.message.includes("messages_no_contact_sharing")
          ? "That message can't be sent — links and contact details aren't allowed here."
          : error.message
      );
      return;
    }

    setDraft("");
    setWarning(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(242,100,25,.10),_transparent_35%),linear-gradient(180deg,#fbf8f3,#f7f3ec)] text-bone">
      <SiteHeader />
      <div className="max-w-5xl mx-auto h-screen flex flex-col">

        <div className="px-6 pt-8 pb-5 border-b border-dashed border-line flex items-end justify-between">
          <div>
            <p className="text-[13px] text-slate mt-1">
              Conversations tied to your active and past products
            </p>
          </div>
        </div>

        {!noticeDismissed && (
          <div className="px-6 py-3 bg-white/75 border-b border-line flex items-start gap-3 backdrop-blur-sm">
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
          <div className="flex flex-1 min-h-0">

            <div className="w-[300px] shrink-0 border-r border-line overflow-y-auto bg-white/60">
              {conversations.map((conversation) => (
                <ConversationRowItem
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === activeId}
                  onClick={() => {
                    setActiveId(conversation.id);
                    setDraft("");
                    setWarning(null);
                  }}
                />
              ))}
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <div className="px-6 py-4 border-b border-line flex items-center gap-3 bg-white/70">
                <Avatar initials={activeConversation.counterpartInitials} />
                <div>
                  <p className="text-[13px] font-medium text-bone">
                    {activeConversation.counterpartName}
                  </p>
                  <p className="text-[11px] text-slate">
                    Re: {activeConversation.gigTitle ?? "General inquiry"}
                  </p>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 bg-[linear-gradient(180deg,rgba(255,255,255,.40),rgba(255,255,255,.70))]">
                {messages.map((message) => (
                  <MessageEntry
                    key={message.id}
                    message={message}
                    isYou={message.sender_id === userId}
                    senderName={message.sender_id === userId ? "You" : activeConversation.counterpartName}
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

              <div className="px-6 py-4 border-t border-dashed border-line bg-white/70">
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
