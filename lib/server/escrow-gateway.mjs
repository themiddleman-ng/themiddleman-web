// No live payments: the route enables this worker only on an isolated preview
// with an sk_test_ key. Never interpret an accepted request as a completed payout.
export async function runGatewayOperation({
  job,
  secret,
  paymentReference,
  fetcher = fetch,
}) {
  if (!/^sk_test_/.test(secret ?? ""))
    throw new Error("Test gateway key required");
  if (
    !Number.isSafeInteger(Number(job.amount_kobo)) ||
    Number(job.amount_kobo) <= 0
  )
    throw new Error("Invalid operation amount");
  const request = async (path, body) => {
    const response = await fetcher(`https://api.paystack.co${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    let result;
    try {
      result = await response.json();
    } catch {
      return null;
    }
    if (!response.ok || result.status !== true) return null;
    return result.data;
  };
  try {
    let data;
    if (job.kind === "payout") {
      if (!/^RCP_[a-zA-Z0-9]+$/.test(job.recipient_code ?? ""))
        throw new Error("Verified payout recipient required");
      // Reconcile before sending. The reference is deterministic and reused.
      data = await request(
        `/transfer/verify/${encodeURIComponent(job.reference)}`,
      );
      if (!data && job.status === "processing") {
        const submitted = await request("/transfer", {
          source: "balance",
          amount: Number(job.amount_kobo),
          currency: "NGN",
          reference: job.reference,
          recipient: job.recipient_code,
          reason: "The Middleman delivery payout",
        });
        if (!submitted)
          return {
            status: "uncertain",
            providerId: null,
            error: "Provider outcome unknown; reconcile before retry",
          };
        // Verify the expanded recipient and final status with a read request.
        data = await request(
          `/transfer/verify/${encodeURIComponent(job.reference)}`,
        );
        if (!data)
          return {
            status: "submitted",
            providerId: submitted.transfer_code ?? null,
            error: null,
          };
      }
      if (
        !data ||
        data.domain !== "test" ||
        data.currency !== "NGN" ||
        data.reference !== job.reference ||
        data.amount !== Number(job.amount_kobo) ||
        data.recipient?.recipient_code !== job.recipient_code
      )
        return {
          status: "uncertain",
          providerId: null,
          error: "Transfer details do not match the locked operation",
        };
      return {
        status:
          data.status === "success"
            ? "succeeded"
            : ["failed", "reversed"].includes(data.status)
              ? "failed"
              : "submitted",
        providerId: data.transfer_code,
        error: null,
      };
    }
    if (
      job.kind !== "refund" ||
      !/^mm_[0-9a-f-]{36}$/.test(paymentReference ?? "")
    )
      throw new Error("Invalid refund binding");
    // Only a newly claimed job sends a refund. Submitted/uncertain jobs are
    // read-only reconciliation; missing provider IDs require operator lookup.
    if (job.provider_id) {
      data = await request(`/refund/${encodeURIComponent(job.provider_id)}`);
      const transaction = await request(
        `/transaction/verify/${encodeURIComponent(paymentReference)}`,
      );
      if (
        !data ||
        !transaction ||
        transaction.domain !== "test" ||
        transaction.reference !== paymentReference ||
        (typeof data.transaction === "object"
          ? data.transaction?.id
          : data.transaction) !== transaction.id
      )
        return {
          status: "uncertain",
          providerId: job.provider_id,
          error: "Refund binding could not be verified",
        };
    } else if (job.status === "processing" && job.attempts === 1) {
      data = await request("/refund", {
        transaction: paymentReference,
        amount: Number(job.amount_kobo),
        currency: "NGN",
        merchant_note: job.reference,
      });
      if (data?.transaction?.reference !== paymentReference)
        return {
          status: "uncertain",
          providerId: data?.id ? String(data.id) : null,
          error: "Refund binding could not be verified",
        };
    } else
      return {
        status: "uncertain",
        providerId: null,
        error: "Refund requires provider reconciliation",
      };
    if (
      !data ||
      data.domain !== "test" ||
      data.currency !== "NGN" ||
      data.amount !== Number(job.amount_kobo)
    )
      return {
        status: "uncertain",
        providerId: job.provider_id ?? null,
        error: "Refund details do not match the locked operation",
      };
    return {
      status:
        data.status === "processed"
          ? "succeeded"
          : data.status === "failed"
            ? "failed"
            : "submitted",
      providerId: String(data.id ?? job.provider_id),
      error: null,
    };
  } catch {
    return {
      status: "uncertain",
      providerId: job.provider_id ?? null,
      error: "Gateway request interrupted; reconcile before retry",
    };
  }
}
