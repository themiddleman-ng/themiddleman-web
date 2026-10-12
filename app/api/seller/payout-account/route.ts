import {
  authenticatedContext,
  privateJson,
  serviceClient,
} from "@/lib/server/marketplace";
import { escrowV2Enabled } from "@/lib/server/escrow-config.mjs";
import { sameOriginMutation } from "@/lib/server/same-origin.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Bank = { name: string; code: string; currency?: string; active?: boolean; country?: string };
type PaystackEnvelope<T> = { status?: boolean; data?: T };
const accountPattern = /^\d{10}$/;
const bankCodePattern = /^[a-zA-Z0-9_-]{2,12}$/;

function paystackHeaders(secret: string, json = false) {
  return {
    Authorization: "Bearer " + secret,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

async function readBanks(secret: string): Promise<Bank[] | null> {
  const response = await fetch("https://api.paystack.co/bank?currency=NGN", {
    headers: paystackHeaders(secret),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as PaystackEnvelope<Bank[]>;
  if (!payload.status || !Array.isArray(payload.data)) return null;
  return payload.data.filter((bank) =>
    typeof bank.name === "string" &&
    typeof bank.code === "string" &&
    bank.currency === "NGN" &&
    bank.active !== false &&
    (!bank.country || bank.country.toLowerCase() === "nigeria")
  );
}

async function resolveAccount(secret: string, accountNumber: string, bankCode: string) {
  const url = new URL("https://api.paystack.co/bank/resolve");
  url.searchParams.set("account_number", accountNumber);
  url.searchParams.set("bank_code", bankCode);
  const response = await fetch(url, { headers: paystackHeaders(secret), cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as PaystackEnvelope<{
    account_number?: string;
    account_name?: string;
  }> | null;
  const resolvedNumber = payload?.data?.account_number;
  const resolvedName = payload?.data?.account_name;
  if (!response.ok || !payload?.status || typeof resolvedNumber !== "string" ||
    typeof resolvedName !== "string" || !resolvedName.trim() ||
    resolvedNumber !== accountNumber) return null;
  return { account_number: resolvedNumber, account_name: resolvedName };
}

function normalizeAccountName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleUpperCase("en-NG");
}

async function sellerContext() {
  const session = await authenticatedContext();
  if (!session) return null;
  const db = serviceClient();
  if (!db) return null;
  const [{ data: userRow }, { data: seller }] = await Promise.all([
    db.from("users").select("is_seller").eq("id", session.user.id).maybeSingle(),
    db.from("seller_profiles").select("id,user_id").eq("user_id", session.user.id).maybeSingle(),
  ]);
  if (!userRow?.is_seller) return null;
  return { user: session.user, db, seller };
}

async function allowVerification(db: NonNullable<ReturnType<typeof serviceClient>>, userId: string) {
  const { data, error } = await db.rpc("consume_seller_payout_verification_attempt", {
    p_user_id: userId,
  });
  return !error && data === true;
}

export async function GET() {
  if (!escrowV2Enabled()) return privateJson({ error: "Payout setup is not enabled here." }, 503);
  const context = await sellerContext();
  if (!context) return privateJson({ error: "A seller account is required." }, 403);
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return privateJson({ error: "Bank verification is not configured." }, 503);
  const banks = await readBanks(secret);
  if (!banks) return privateJson({ error: "Could not load bank list. Please try again." }, 502);
  return privateJson({ banks: banks.map(({ name, code }) => ({ name, code })) });
}

export async function POST(request: Request) {
  if (!sameOriginMutation(request)) return privateJson({ error: "Invalid request origin." }, 403);
  if (!escrowV2Enabled()) return privateJson({ error: "Payout setup is not enabled here." }, 503);
  const context = await sellerContext();
  if (!context) return privateJson({ error: "A seller account is required." }, 403);
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return privateJson({ error: "Bank verification is not configured." }, 503);

  let body: {
    action?: string;
    accountNumber?: string;
    bankCode?: string;
    verifiedAccountName?: string;
  };
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "Invalid request." }, 400);
  }

  const accountNumber = typeof body.accountNumber === "string" ? body.accountNumber.trim() : "";
  const bankCode = typeof body.bankCode === "string" ? body.bankCode.trim() : "";
  if (!["resolve", "save"].includes(body.action ?? "") ||
    !accountPattern.test(accountNumber) || !bankCodePattern.test(bankCode)) {
    return privateJson({ error: "Enter a valid 10-digit Nigerian account number and choose a bank." }, 400);
  }

  if (!(await allowVerification(context.db, context.user.id))) {
    return privateJson({ error: "Too many account checks today. Try again tomorrow." }, 429);
  }

  const banks = await readBanks(secret);
  const bank = banks?.find((item) => item.code === bankCode);
  if (!bank) return privateJson({ error: "Choose an active Nigerian bank from the list." }, 400);

  const resolved = await resolveAccount(secret, accountNumber, bankCode);
  if (!resolved) return privateJson({ error: "We could not verify those account details. Check the bank and number." }, 422);

  if (body.action === "resolve") {
    return privateJson({ verified: true, accountName: resolved.account_name, bankName: bank.name });
  }

  if (typeof body.verifiedAccountName !== "string" ||
    normalizeAccountName(body.verifiedAccountName) !== normalizeAccountName(resolved.account_name)) {
    return privateJson({ error: "Verify the account again and confirm the returned account name." }, 409);
  }

  if (!context.seller) return privateJson({ error: "Complete your creator profile before saving a payout account." }, 409);

  const recipientResponse = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: paystackHeaders(secret, true),
    body: JSON.stringify({
      type: "nuban",
      name: resolved.account_name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    }),
    cache: "no-store",
  });
  const recipientPayload = (await recipientResponse.json().catch(() => null)) as PaystackEnvelope<{
    recipient_code?: string;
  }> | null;
  const recipientCode = recipientPayload?.data?.recipient_code;
  if (!recipientResponse.ok || !recipientPayload?.status ||
    typeof recipientCode !== "string" || !/^RCP_[a-zA-Z0-9]+$/.test(recipientCode)) {
    return privateJson({ error: "The bank account checked out, but payout setup did not finish. Please try again." }, 502);
  }

  const saved = await context.db.from("seller_payout_accounts").upsert({
    seller_id: context.seller.id,
    recipient_code: recipientCode,
    bank_code: bank.code,
    bank_name: bank.name,
    account_name: resolved.account_name,
    account_last4: accountNumber.slice(-4),
    currency: "NGN",
    verification_provider: "paystack",
    verified_by: context.user.id,
    verified_at: new Date().toISOString(),
  }, { onConflict: "seller_id" });
  if (saved.error) {
    return privateJson({ error: "Verification succeeded, but payout details could not be saved. Please retry." }, 503);
  }

  return privateJson({
    verified: true,
    accountName: resolved.account_name,
    bankName: bank.name,
    accountLast4: accountNumber.slice(-4),
  });
}
