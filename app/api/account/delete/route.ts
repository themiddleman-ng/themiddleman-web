import { authenticatedContext, privateJson, serviceClient } from '@/lib/server/marketplace';
import { createResendMailer } from '@/lib/server/email.mjs';
import { sameOriginMutation } from '@/lib/server/same-origin.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_SIGN_IN_AGE_MS = 10 * 60 * 1000;

function htmlEscape(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character);
}

async function verificationFiles(db: NonNullable<ReturnType<typeof serviceClient>>, prefix: string) {
  const files: string[] = [];
  async function visit(folder: string, depth: number) {
    if (depth > 4 || files.length > 1000) throw new Error('Verification files exceed the cleanup limit.');
    let offset = 0;
    for (;;) {
      const { data, error } = await db.storage.from('verification-docs').list(folder, { limit: 100, offset });
      if (error) throw new Error('Could not list identity documents.');
      const rows = data ?? [];
      for (const row of rows) {
        const path = `${folder}/${row.name}`;
        if (row.id === null) await visit(path, depth + 1);
        else files.push(path);
      }
      if (rows.length < 100) break;
      offset += rows.length;
    }
  }
  await visit(prefix, 0);
  return files;
}

async function removeVerificationFiles(db: NonNullable<ReturnType<typeof serviceClient>>, userId: string) {
  const files = await verificationFiles(db, userId);
  for (let start = 0; start < files.length; start += 100) {
    const { error } = await db.storage.from('verification-docs').remove(files.slice(start, start + 100));
    if (error) throw new Error('Could not remove identity documents.');
  }
}

function completionEmail() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://themiddleman.com.ng';
  const text = [
    'Your Middleman account has been deleted.',
    '',
    'Your profile, conversations and seller payout details were removed, and active listings were archived. Order and payment records may be kept in de-identified form for transaction history and legal obligations.',
    '',
    'If you would like to share feedback, you can reply to this email.',
    '',
    `The Middleman · ${siteUrl}`,
  ].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;color:#243344;line-height:1.6;max-width:560px;margin:auto;padding:24px"><h1 style="font-size:24px">Your account has been deleted</h1><p>Your Middleman profile, conversations and seller payout details were removed, and active listings were archived.</p><p>Order and payment records may be kept in de-identified form for transaction history and legal obligations.</p><p>If you would like to share feedback, you can reply to this email.</p><p style="margin-top:28px;color:#6b7680">The Middleman</p><a href="${htmlEscape(siteUrl)}" style="color:#111111">Visit The Middleman</a></div>`;
  return { text, html };
}

export async function POST(request: Request) {
  if (!sameOriginMutation(request)) return privateJson({ error: 'Invalid request origin.' }, 403);

  let body: { confirmation?: string };
  try { body = await request.json(); }
  catch { return privateJson({ error: 'Invalid request.' }, 400); }
  if (body.confirmation !== 'DELETE') return privateJson({ error: 'Confirm by entering DELETE.' }, 400);

  const context = await authenticatedContext(true);
  if (!context) return privateJson({ error: 'Sign in again to continue.' }, 401);
  const db = serviceClient();
  if (!db) return privateJson({ error: 'Account deletion is not configured here.' }, 503);

  const authUserResult = await db.auth.admin.getUserById(context.user.id);
  const authUser = authUserResult.data?.user;
  if (authUserResult.error || !authUser || (authUser as typeof authUser & { deleted_at?: string | null }).deleted_at) {
    return privateJson({ error: 'This account is already closed or could not be verified.' }, 409);
  }
  const accountEmail = authUser.email?.trim();
  if (!accountEmail || !authUser.email_confirmed_at) return privateJson({ error: 'A verified email is required before account deletion.' }, 409);

  const signedInAt = Date.parse(authUser.last_sign_in_at ?? '');
  const age = Date.now() - signedInAt;
  if (!Number.isFinite(signedInAt) || age < -60_000 || age > MAX_SIGN_IN_AGE_MS) {
    return privateJson({ error: 'For your security, confirm your password again and retry.' }, 428);
  }

  const [roleResult, assuranceResult, factorsResult, sellerResult] = await Promise.all([
    db.from('profiles').select('role').eq('id', context.user.id).maybeSingle(),
    context.client.auth.mfa.getAuthenticatorAssuranceLevel(),
    context.client.auth.mfa.listFactors(),
    db.from('seller_profiles').select('id').eq('user_id', context.user.id).maybeSingle(),
  ]);
  if (roleResult.data?.role === 'admin') {
    return privateJson({ error: 'Administrator accounts must be reviewed by another administrator.' }, 403);
  }
  if (roleResult.error) return privateJson({ error: 'Could not confirm account permissions.' }, 503);
  if (factorsResult.error || assuranceResult.error) {
    return privateJson({ error: 'Could not confirm your sign-in security level. Try again.' }, 503);
  }
  const hasVerifiedFactor = factorsResult.data?.all.some((factor) => factor.status === 'verified') ?? false;
  if (hasVerifiedFactor && assuranceResult.data?.currentLevel !== 'aal2') {
    return privateJson({ error: 'Complete two-step verification before deleting your account.' }, 403);
  }
  if (sellerResult.error) return privateJson({ error: 'Could not prepare your seller information for removal.' }, 503);

  const prepared = await db.rpc('prepare_account_deletion', { p_user_id: context.user.id });
  if (prepared.error) return privateJson({ error: 'Account deletion is not ready in this environment. Please try again later.' }, 503);
  const preparation = prepared.data as { ok?: boolean; reason?: string } | null;
  if (!preparation?.ok) {
    const messages: Record<string, string> = {
      active_orders: 'Close or complete your active orders before deleting your account.',
      active_disputes: 'Your account cannot be deleted while a dispute is being reviewed.',
      open_support_case: 'Please wait until your open support conversation is resolved.',
      not_found: 'We could not find the account to delete.',
    };
    return privateJson({ error: messages[preparation?.reason ?? ''] ?? 'Your account could not be prepared for deletion.' }, 409);
  }

  if (sellerResult.data?.id) {
    try { await removeVerificationFiles(db, context.user.id); }
    catch { return privateJson({ error: 'Your identity documents could not be removed yet. Please retry to finish.' }, 503); }
  }

  const deletion = await db.auth.admin.deleteUser(context.user.id, true);
  if (deletion.error) {
    const verification = await db.auth.admin.getUserById(context.user.id);
    const alreadyDeleted = Boolean((verification.data?.user as (typeof authUser & { deleted_at?: string | null }) | null)?.deleted_at);
    if (!alreadyDeleted) {
      return privateJson({ error: 'Your profile has been anonymized, but sign-in could not yet be closed. Please retry to finish.' }, 503);
    }
  }

  const mail = createResendMailer();
  const message = completionEmail();
  const emailResult = await mail.send({
    to: accountEmail,
    subject: 'Your Middleman account has been deleted',
    attachments: [],
    ...message,
  });

  return privateJson({ ok: true, emailSent: emailResult.ok });
}
