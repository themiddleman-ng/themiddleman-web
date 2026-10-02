import { authenticatedUser, privateJson } from '@/lib/server/marketplace';
import { sameOriginMutation } from '@/lib/server/same-origin.mjs';
import { createResendMailer, testEmailTemplate } from '@/lib/server/email.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!sameOriginMutation(request)) {
    return privateJson({ error: 'Invalid request origin.' }, 403);
  }

  const user = await authenticatedUser();
  if (!user?.email) {
    return privateJson({ error: 'Sign in with an email address to test email delivery.' }, 401);
  }

  const result = await createResendMailer().send({
    to: user.email,
    ...testEmailTemplate(),
  });

  if (!result.ok) {
    return privateJson({ error: result.error }, result.status);
  }

  return privateJson({ ok: true, id: result.id });
}
