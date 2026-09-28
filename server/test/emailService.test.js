import assert from 'node:assert/strict';
import test from 'node:test';
import { sendEmail } from '../src/services/emailService.js';

test('sendEmail sends a transactional email through the Brevo API', async (t) => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.BREVO_API_KEY;
  const originalSenderEmail = process.env.BREVO_SENDER_EMAIL;
  const originalSenderName = process.env.BREVO_SENDER_NAME;

  t.after(() => {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = originalApiKey;
    if (originalSenderEmail === undefined) delete process.env.BREVO_SENDER_EMAIL;
    else process.env.BREVO_SENDER_EMAIL = originalSenderEmail;
    if (originalSenderName === undefined) delete process.env.BREVO_SENDER_NAME;
    else process.env.BREVO_SENDER_NAME = originalSenderName;
  });

  process.env.BREVO_API_KEY = 'test-api-key';
  process.env.BREVO_SENDER_EMAIL = 'sender@example.com';
  process.env.BREVO_SENDER_NAME = 'Sprintly Test';

  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      async json() {
        return { messageId: 'brevo-message-id' };
      },
    };
  };

  const result = await sendEmail({
    to: 'recipient@example.com',
    subject: 'Verify your email',
    html: '<p>Verify</p>',
    text: 'Verify',
  });

  assert.equal(request.url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers['api-key'], 'test-api-key');
  assert.deepEqual(JSON.parse(request.options.body), {
    sender: { name: 'Sprintly Test', email: 'sender@example.com' },
    to: [{ email: 'recipient@example.com' }],
    subject: 'Verify your email',
    htmlContent: '<p>Verify</p>',
    textContent: 'Verify',
  });
  assert.deepEqual(result, {
    success: true,
    provider: 'brevo',
    messageId: 'brevo-message-id',
  });
});
