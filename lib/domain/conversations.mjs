// PostgREST to-one embeds are objects; support older array-shaped fixtures too.
export function oneRelation(value) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
// A gig has one seller. Do not compare conversation seller user IDs with
// order seller profile IDs. Both queries are independently participant-scoped.
export function paidConversationKey(row) {
  return `${row.buyer_id}:${row.gig_id}`;
}
