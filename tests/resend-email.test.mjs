import assert from 'node:assert/strict';
import test from 'node:test';
import { createResendMailer, testEmailTemplate } from '../lib/server/email.mjs';

test('Resend mailer sends the expected server-side request', async () => {
  let captured;
  const mailer = createResendMailer({
    apiKey: 're_test_only',
    from: 'The Middleman <notifications@mail.themiddleman.com.ng>',
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return Response.json({ id: 'email_test_1' }, { status: 200 });
    },
  });

  const result = await mailer.send({
    to: 'buyer@example.com',
    ...testEmailTemplate(),
  });

  assert.deepEqual(result, { ok: true, id: 'email_test_1' });
  assert.equal(captured.url, 'https://api.resend.com/emails');
  assert.equal(captured.options.headers.Authorization, 'Bearer re_test_only');

  const payload = JSON.parse(captured.options.body);
  assert.equal(payload.from, 'The Middleman <notifications@mail.themiddleman.com.ng>');
  assert.deepEqual(payload.to, ['buyer@example.com']);
  assert.equal(payload.subject, 'The Middleman email setup is working');
});

test('Resend mailer fails closed when the API key is missing', async () => {
  const result = await createResendMailer({ apiKey: '' }).send({
    to: 'buyer@example.com',
    subject: 'Test',
    text: 'Test',
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 503);
});
