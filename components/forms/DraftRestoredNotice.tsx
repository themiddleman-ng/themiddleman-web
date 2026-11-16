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
      className="mb-4 rounded-lg border border-line bg-paper px-3 py-2 text-[13px] leading-5 text-muted"
    >
      Draft restored ·{" "}
      <button
        type="button"
        onClick={onDiscard}
        className="font-semibold text-muted underline decoration-[#e7b49a] underline-offset-2"
      >
        Discard
      </button>
    </p>
  );
}
