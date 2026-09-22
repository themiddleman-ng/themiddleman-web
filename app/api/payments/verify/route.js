// Browser callbacks are notifications, never payment authority.
export async function POST() {
  return Response.json({ pending: true, message: 'Payment confirmation is handled by the secure webhook. Check My Orders shortly.' }, { status: 202 });
}
