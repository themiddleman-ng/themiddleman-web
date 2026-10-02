const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'The Middleman <notifications@mail.themiddleman.com.ng>';

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function createResendMailer({
  apiKey = process.env.RESEND_API_KEY,
  from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
  fetchImpl = fetch,
} = {}) {
  return {
    async send({ to, subject, html, text }) {
      const recipient = cleanText(to);
      const mailSubject = cleanText(subject);

      if (!apiKey || !apiKey.startsWith('re_')) {
        return { ok: false, status: 503, error: 'Email service is not configured.' };
      }

      if (!recipient || !recipient.includes('@') || !mailSubject || (!html && !text)) {
        return { ok: false, status: 400, error: 'Invalid email payload.' };
      }

      let response;
      try {
        response = await fetchImpl(RESEND_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [recipient],
            subject: mailSubject,
            ...(html ? { html } : {}),
            ...(text ? { text } : {}),
          }),
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        return { ok: false, status: 502, error: 'Email provider could not be reached.' };
      }

      let body = null;
      try { body = await response.json(); } catch {}

      if (!response.ok) {
        return { ok: false, status: 502, error: 'Email provider rejected the message.' };
      }

      return { ok: true, id: body?.id ?? null };
    },
  };
}

export function testEmailTemplate() {
  const subject = 'The Middleman email setup is working';
  const text = [
    'Your The Middleman transactional email setup is working.',
    '',
    'This is a Preview-environment test. No order or payment was changed.',
  ].join('\n');

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#111827">
    <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;padding:32px">
      <div style="font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0b3d91">The Middleman</div>
      <h1 style="font-size:24px;line-height:1.3;margin:18px 0 12px">Email setup is working</h1>
      <p style="font-size:16px;line-height:1.65;margin:0 0 18px">Resend is connected successfully to The Middleman.</p>
      <p style="font-size:14px;line-height:1.6;color:#6b7280;margin:0">This is a Preview-environment test. No order or payment was changed.</p>
    </div>
  </body>
</html>`;

  return { subject, text, html };
}
