import { authenticatedUser, privateJson, serviceClient, uuidPattern } from '@/lib/server/marketplace';
import { sameOriginMutation } from '@/lib/server/same-origin.mjs';

export const runtime = 'nodejs';

async function access(id: string) {
  if (!uuidPattern.test(id)) return null;
  const user = await authenticatedUser();
  const db = serviceClient();
  if (!user || !db) return null;
  const { data: conversation } = await db.from('conversations').select('buyer_id,seller_id').eq('id', id).maybeSingle();
  if (!conversation || (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)) return null;
  return { user, db };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await access(id);
  if (!session) return privateJson({ error: 'Conversation not found.' }, 404);
  const { data, error } = await session.db.from('messages')
    .select('id,conversation_id,sender_id,body,created_at').eq('conversation_id', id)
    .order('created_at', { ascending: true }).limit(200);
  if (error) return privateJson({ error: 'Could not load messages.' }, 500);
  return privateJson({ messages: (data ?? []).map(message => ({
    id: message.id, conversation_id: message.conversation_id, body: message.body,
    created_at: message.created_at, mine: message.sender_id === session.user.id,
  })) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOriginMutation(request)) return privateJson({ error: 'Invalid request origin.' }, 403);
  const { id } = await params;
  const session = await access(id);
  if (!session) return privateJson({ error: 'Conversation not found.' }, 404);
  let body: { text?: string };
  try { body = await request.json(); } catch { return privateJson({ error: 'Invalid message.' }, 400); }
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text || text.length > 3000 || /https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d\s-]{7,}\d|\b[a-z0-9-]+\.(?:com|net|org|ng|io|co|me|link)\b/i.test(text)) {
    return privateJson({ error: 'Keep contact details and links out of messages (max 3000 characters).' }, 400);
  }
  const { data, error } = await session.db.from('messages')
    .insert({ conversation_id: id, sender_id: session.user.id, body: text })
    .select('id,conversation_id,body,created_at').single();
  return error || !data ? privateJson({ error: 'Could not send message.' }, 409)
    : privateJson({ message: { ...data, mine: true } }, 201);
}
