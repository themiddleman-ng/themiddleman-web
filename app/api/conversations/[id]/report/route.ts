import { authenticatedUser, privateJson, serviceClient, uuidPattern } from '@/lib/server/marketplace';
import { sameOriginMutation } from '@/lib/server/same-origin.mjs';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOriginMutation(request)) return privateJson({ error: 'Invalid request origin.' }, 403);
  const user = await authenticatedUser();
  if (!user) return privateJson({ error: 'Sign in first.' }, 401);
  const db = serviceClient();
  if (!db) return privateJson({ error: 'Reports are not configured.' }, 503);

  const { id } = await params;
  if (!uuidPattern.test(id)) return privateJson({ error: 'Conversation not found.' }, 404);

  let body: { messageId?: string; details?: string };
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: 'Invalid request.' }, 400);
  }

  const { data: conversation } = await db.from('conversations')
    .select('buyer_id,seller_id,gig_id')
    .eq('id', id)
    .maybeSingle();
  if (!conversation || (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)) {
    return privateJson({ error: 'Conversation not found.' }, 404);
  }
  if (!conversation.gig_id) return privateJson({ error: 'This conversation cannot be reported.' }, 409);

  const details = typeof body.details === 'string' ? body.details.trim().slice(0, 500) : '';
  const { error } = await db.from('gig_reports').insert({
    gig_id: conversation.gig_id,
    reported_by: user.id,
    reason: 'enquiry_message',
    details: details || `Reported message${body.messageId ? ` ${body.messageId}` : ''}`,
  });
  if (error) return privateJson({ error: 'Could not submit report.' }, 500);
  return privateJson({ ok: true }, 201);
}
