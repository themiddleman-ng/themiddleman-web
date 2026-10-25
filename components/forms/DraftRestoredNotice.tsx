"use client";

type DraftRestoredNoticeProps = {
  visible: boolean;
  onDiscard: () => void;
};

export default function DraftRestoredNotice({ visible, onDiscard }: DraftRestoredNoticeProps) {
  if (!visible) return null;
  return (
    <p
      role="status"
      className="mb-4 rounded-lg border border-[#e8dfd3] bg-[#f7f3ed] px-3 py-2 text-[13px] leading-5 text-[#4f5c68]"
    >
      Draft restored ·{" "}
      <button
        type="button"
        onClick={onDiscard}
        className="font-semibold text-[#9a3412] underline decoration-[#e7b49a] underline-offset-2"
      >
        Discard
      </button>
    </p>
  );
}
