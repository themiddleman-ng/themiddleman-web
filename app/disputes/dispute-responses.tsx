"use client";
import { useEffect, useState } from "react";
type Dispute = {
  id: string;
  order_id: string;
  reason: string;
  ground: string;
  status: string;
  seller_response_due_at: string;
  seller_response: string | null;
};
export default function DisputeResponses() {
  const [rows, setRows] = useState<Dispute[]>([]),
    [message, setMessage] = useState(""),
    [responses, setResponses] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      const r = await fetch("/api/disputes", { cache: "no-store" });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      setRows(b.disputes ?? []);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Disputes unavailable.");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function submit(id: string) {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disputeId: id, response: responses[id] }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      setMessage("Response saved.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Response failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-8 space-y-5">
      {message && <p role="status">{message}</p>}
      {rows.map((d) => (
        <article
          key={d.id}
          className="rounded-2xl border border-line bg-paper p-6"
        >
          <h2 className="font-semibold">
            Order {d.order_id.slice(0, 8)} · {d.ground.replace(/_/g, " ")}
          </h2>
          <p className="mt-3 text-sm">{d.reason}</p>
          <p className="mt-3 text-sm text-slate">
            Response due {new Date(d.seller_response_due_at).toLocaleString()}
          </p>
          {d.seller_response ? (
            <p className="mt-3">Your response: {d.seller_response}</p>
          ) : (
            d.status === "open" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(d.id);
                }}
              >
                <label className="mt-4 block text-sm">
                  Your evidence
                  <textarea
                    className="auth-input mt-2 min-h-24"
                    minLength={10}
                    maxLength={2000}
                    required
                    value={responses[d.id] ?? ""}
                    onChange={(e) =>
                      setResponses({ ...responses, [d.id]: e.target.value })
                    }
                  />
                </label>
                <button className="auth-button mt-3" disabled={busy}>
                  Send response to admin
                </button>
              </form>
            )
          )}
        </article>
      ))}
    </div>
  );
}
