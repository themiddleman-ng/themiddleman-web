import { adminUser, authenticatedUser, ORDER_DELIVERIES_BUCKET, privateJson, serviceClient, uuidPattern } from '@/lib/server/marketplace';
import { sameOriginMutation } from '@/lib/server/same-origin.mjs';

export const runtime = 'nodejs';
const allowed: Record<string, string> = {
  'application/pdf': 'pdf', 'application/zip': 'zip', 'image/png': 'png',
  'image/jpeg': 'jpg', 'text/plain': 'txt',
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return privateJson({ error: 'Invalid order.' }, 400);
  const user = await authenticatedUser();
  if (!user) return privateJson({ error: 'Sign in first.' }, 401);
  const db = serviceClient();
  if (!db) return privateJson({ error: 'Delivery is not configured.' }, 503);
  const { data: order } = await db.from('orders').select('buyer_id,status').eq('id', id).maybeSingle();
  const isAdmin = order?.buyer_id !== user.id && !!(await adminUser());
  if (!order || (order.buyer_id !== user.id && !isAdmin)) return privateJson({ error: 'Not found.' }, 404);
  const { data: delivery } = await db.from('deliveries').select('storage_path,status')
    .eq('order_id', id).maybeSingle();
  if (!delivery?.storage_path || (!isAdmin &&
    (delivery.status !== 'delivered' || !['delivered','approved','disputed'].includes(order.status)))) {
    return privateJson({ error: 'File is not available.' }, 404);
  }
  const { data, error } = await db.storage.from(ORDER_DELIVERIES_BUCKET)
    .createSignedUrl(delivery.storage_path, 60);
  return error || !data ? privateJson({ error: 'File is unavailable.' }, 404) : privateJson({ url: data.signedUrl });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOriginMutation(request)) return privateJson({ error: 'Invalid request origin.' }, 403);
  const { id } = await params;
  if (!uuidPattern.test(id)) return privateJson({ error: 'Invalid order.' }, 400);
  const user = await authenticatedUser();
  if (!user) return privateJson({ error: 'Sign in first.' }, 401);
  const db = serviceClient();
  if (!db) return privateJson({ error: 'Delivery is not configured.' }, 503);
  const { data: order, error: orderError } = await db.from('orders')
    .select('seller_id,status').eq('id', id).maybeSingle();
  if (orderError) return privateJson({ error: 'Could not check order.' }, 500);
  if (!order || order.status !== 'in_escrow') return privateJson({ error: 'Order is not awaiting delivery.' }, 409);
  const { data: seller } = await db.from('seller_profiles').select('user_id').eq('id', order.seller_id).maybeSingle();
  if (seller?.user_id !== user.id) return privateJson({ error: 'Not found.' }, 404);

  let body: { intent?: string; contentType?: string; storagePath?: string };
  try { body = await request.json(); } catch { return privateJson({ error: 'Invalid request.' }, 400); }
  if (body.intent === 'sign') {
    const extension = allowed[body.contentType ?? ''];
    if (!extension) return privateJson({ error: 'Use a PDF, ZIP, PNG, JPEG, or text file (10 MB maximum).' }, 400);
    const path = `${id}/${crypto.randomUUID()}.${extension}`;
    const { data, error } = await db.storage.from(ORDER_DELIVERIES_BUCKET).createSignedUploadUrl(path);
    return error || !data ? privateJson({ error: 'Could not prepare upload.' }, 500)
      : privateJson({ path, token: data.token });
  }
  if (body.intent === 'submit') {
    const path = body.storagePath;
    if (typeof path !== 'string' || !new RegExp(`^${id}/[0-9a-f-]{36}[.](pdf|zip|png|jpg|txt)$`).test(path)) {
      return privateJson({ error: 'Invalid delivery file.' }, 400);
    }
    const { data: file, error: fileError } = await db.storage.from(ORDER_DELIVERIES_BUCKET).info(path);
    if (fileError || !file || Number(file.size) > 10485760 || !allowed[file.contentType ?? '']) {
      return privateJson({ error: 'Upload a supported file before submitting.' }, 400);
    }
    const { data, error } = await db.rpc('submit_order_delivery', {
      p_order_id: id, p_seller_uid: user.id, p_storage_path: path,
    });
    return error ? privateJson({ error: error.message }, 409) : privateJson({ deliveryId: data }, 201);
  }
  return privateJson({ error: 'Unknown action.' }, 400);
}
