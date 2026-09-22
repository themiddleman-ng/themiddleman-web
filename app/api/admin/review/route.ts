import { adminUser, privateJson, uuidPattern } from '@/lib/server/marketplace';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const administrator = await adminUser();
  if (!administrator) return privateJson({ error: 'Admin access required.' }, 403);
  let body: { deliveryId?: string; decision?: string; notes?: string };
  try { body = await request.json(); } catch { return privateJson({ error: 'Invalid request.' }, 400); }
  if (!uuidPattern.test(body.deliveryId ?? '') || !['approve', 'reject'].includes(body.decision ?? '')) {
    return privateJson({ error: 'Invalid review action.' }, 400);
  }
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  if (notes.length > 2000 || (body.decision === 'reject' && notes.length < 5)) {
    return privateJson({ error: 'Rejection needs a reason (5-2000 characters).' }, 400);
  }
  const { data, error } = await administrator.db.rpc('review_order_delivery', {
    p_delivery_id: body.deliveryId, p_admin_uid: administrator.user.id,
    p_approve: body.decision === 'approve', p_notes: notes,
  });
  return error ? privateJson({ error: error.message }, 409) : privateJson({ status: data });
}
