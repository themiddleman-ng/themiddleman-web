"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type Row = Record<string, unknown> & { id?: string };
export default function EscrowControls({
  listings,
  sellers,
  disputes,
  operations,
  signals,
}: {
  listings: Row[];
  sellers: Row[];
  disputes: Row[];
  operations: Row[];
  signals: Row[];
}) {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({}),
    [refunds, setRefunds] = useState<Record<string, string>>({});
  const [sellerId, setSellerId] = useState(""),
    [recipient, setRecipient] = useState(""),
    [adminEmail, setAdminEmail] = useState("");
  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/admin/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error ?? "Action failed.");
      setMessage("Saved and audited.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }
  function note(id: string) {
    return (
      <label className="mt-4 block text-sm">
        Decision notes
        <textarea
          className="auth-input mt-2 min-h-20"
          maxLength={2000}
          value={notes[id] ?? ""}
          onChange={(e) => setNotes({ ...notes, [id]: e.target.value })}
        />
      </label>
    );
  }
  const button =
    "rounded-full border border-line px-4 py-2 text-sm disabled:opacity-50";
  return (
    <div className="mt-8 space-y-10">
      {message && (
        <p role="status" className="rounded-xl border border-line p-4">
          {message}
        </p>
      )}
      <section>
        <h2 className="font-display text-2xl font-semibold">
          Seller verification
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {sellers.map((s) => (
            <article
              className="rounded-2xl border border-line bg-paper p-5"
              key={s.id}
            >
              <h3>{String(s.display_name)}</h3>
              {note(s.id!)}
              <div className="mt-3 flex gap-3">
                {["approved", "rejected"].map((decision) => (
                  <button
                    className={button}
                    disabled={busy}
                    key={decision}
                    onClick={() =>
                      act({
                        action: "seller",
                        id: s.id,
                        decision,
                        notes: notes[s.id!],
                      })
                    }
                  >
                    {decision === "approved"
                      ? "Approve seller"
                      : "Reject seller"}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-display text-2xl font-semibold">
          Listing approval
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {listings.map((l) => (
            <article
              className="rounded-2xl border border-line bg-paper p-5"
              key={l.id}
            >
              <h3 className="font-semibold">{String(l.title)}</h3>
              <p className="mt-2 break-all text-sm text-slate">
                {String(l.repo_url ?? "No repository submitted")}
                <br />
                Commit: {String(l.preview_commit_sha ?? "—")}
              </p>
              <p className="mt-2 text-sm text-slate">
                Check the preview, listing and exact repository commit. Record
                evidence in the notes.
              </p>
              {note(l.id!)}
              <div className="mt-3 flex gap-3">
                <button
                  className={button}
                  disabled={busy}
                  onClick={() =>
                    act({
                      action: "listing",
                      id: l.id,
                      decision: "approved",
                      notes: notes[l.id!],
                    })
                  }
                >
                  Approve listing
                </button>
                <button
                  className={button}
                  disabled={busy}
                  onClick={() =>
                    act({
                      action: "listing",
                      id: l.id,
                      decision: "changes_requested",
                      notes: notes[l.id!],
                    })
                  }
                >
                  Request changes
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-display text-2xl font-semibold">Disputes</h2>
        <div className="mt-4 space-y-4">
          {disputes.map((d) => (
            <article
              className="rounded-2xl border border-line bg-paper p-5"
              key={d.id}
            >
              <h3>
                Order {String(d.order_id).slice(0, 8)} · {String(d.ground)}
              </h3>
              <p className="mt-3 text-sm">{String(d.reason)}</p>
              <p className="mt-3 text-sm text-slate">
                Seller: {String(d.seller_response ?? "Awaiting response")} · Due{" "}
                {String(d.seller_response_due_at)}
              </p>
              {note(d.id!)}
              <label className="mt-4 block text-sm">
                Product principal to refund, in kobo (0 = reject; full product
                price = full refund)
                <input
                  className="auth-input mt-2"
                  inputMode="numeric"
                  value={refunds[d.id!] ?? ""}
                  onChange={(e) =>
                    setRefunds({ ...refunds, [d.id!]: e.target.value })
                  }
                />
              </label>
              <p className="mt-2 text-xs text-slate">
                Buyer fees and VAT are refunded in the same proportion. Seller
                payout uses the retained product proportion.
              </p>
              <button
                className={`${button} mt-4`}
                disabled={busy}
                onClick={() =>
                  act({
                    action: "resolve",
                    id: d.id,
                    principalRefundKobo: refunds[d.id!],
                    notes: notes[d.id!],
                  })
                }
              >
                Record resolution
              </button>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-display text-2xl font-semibold">
          Gateway operations
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-3">Order</th>
                <th>Action</th>
                <th>Kobo</th>
                <th>Status</th>
                <th>Provider confirmation</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((o) => (
                <tr className="border-t border-line" key={o.id}>
                  <td className="p-3">{String(o.order_id).slice(0, 8)}</td>
                  <td>{String(o.kind)}</td>
                  <td>{String(o.amount_kobo)}</td>
                  <td>{String(o.status)}</td>
                  <td>{String(o.provider_id ?? o.last_error ?? "Pending")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate">
          Unknown gateway outcomes require reconciliation. No retry control can
          blindly issue a second refund.
        </p>
      </section>
      <section>
        <h2 className="font-display text-2xl font-semibold">
          Seller review signals
        </h2>
        {signals.map((s) => (
          <p className="mt-3 text-sm" key={String(s.seller_id)}>
            Seller {String(s.seller_id)}: {String(s.upheld_disputes_90d)} upheld
            disputes in 90 days.
          </p>
        ))}
      </section>
      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="font-display text-xl">Verified payout recipient</h2>
        <p className="mt-2 text-sm text-slate">
          Verify ownership in Paystack before assigning a recipient. This does
          not send a payout.
        </p>
        <label className="mt-4 block text-sm">
          Seller profile ID
          <input
            className="auth-input mt-2"
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
          />
        </label>
        <label className="mt-4 block text-sm">
          Paystack recipient code
          <input
            className="auth-input mt-2"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </label>
        <button
          disabled={busy}
          className={`${button} mt-4`}
          onClick={() =>
            act({ action: "recipient", id: sellerId, recipientCode: recipient })
          }
        >
          Save verified recipient
        </button>
      </section>
      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="font-display text-xl">Admin notification email</h2>
        <label className="mt-4 block text-sm">
          Work email
          <input
            type="email"
            className="auth-input mt-2"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
          />
        </label>
        <button
          disabled={busy}
          className={`${button} mt-4`}
          onClick={() => act({ action: "email", email: adminEmail })}
        >
          Save notification email
        </button>
      </section>
    </div>
  );
}
