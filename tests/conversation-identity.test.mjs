import test from 'node:test';
import assert from 'node:assert/strict';
import { oneRelation, paidConversationKey } from '../lib/domain/conversations.mjs';
test('to-one relations work with PostgREST objects and array-shaped legacy fixtures', () => {
  assert.equal(oneRelation({user_id:'seller-user'}).user_id,'seller-user');
  assert.equal(oneRelation([{user_id:'seller-user'}]).user_id,'seller-user');
  assert.equal(oneRelation([]),null);
  assert.equal(oneRelation(null),null);
});
test('paid order matching survives distinct seller profile/user IDs without mixing buyers or products', () => {
  const order={buyer_id:'buyer-a',seller_id:'profile-id',gig_id:'gig-a'};
  const conversation={buyer_id:'buyer-a',seller_id:'user-id',gig_id:'gig-a'};
  assert.equal(paidConversationKey(order),paidConversationKey(conversation));
  assert.notEqual(paidConversationKey(order),paidConversationKey({...conversation,buyer_id:'buyer-b'}));
  assert.notEqual(paidConversationKey(order),paidConversationKey({...conversation,gig_id:'gig-b'}));
});
