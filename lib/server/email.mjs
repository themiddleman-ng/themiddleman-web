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
    async send({ to, subject, html, text, attachments }) {
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
            ...(Array.isArray(attachments) && attachments.length ? { attachments } : {}),
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
