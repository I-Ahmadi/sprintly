import { CLIENT_URL } from '../config/env.js';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function logEmail(message) {
  const recipients = (Array.isArray(message.to) ? message.to : [message.to])
    .map((recipient) => typeof recipient === 'string' ? recipient : recipient?.email)
    .filter(Boolean);

  console.info('\n[local email]');
  console.info(`To: ${recipients.join(', ')}`);
  console.info(`Subject: ${message.subject}`);
  console.info(message.text || message.html || '');
  console.info('[/local email]\n');

  return {
    success: true,
    provider: 'local-console',
    messageId: `local-${Date.now()}`,
  };
}

export async function sendEmail(options) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Sprintly';

  if (!apiKey || !senderEmail) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Brevo email configuration is missing');
    }
    return logEmail(options);
  }

  const recipients = (Array.isArray(options.to) ? options.to : [options.to])
    .map((recipient) => typeof recipient === 'string' ? { email: recipient } : recipient)
    .filter((recipient) => recipient?.email);

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: recipients,
      subject: options.subject,
      htmlContent: options.html || options.text,
      textContent: options.text,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Brevo email request failed (${response.status}): ${details}`);
  }

  const result = await response.json();
  return {
    success: true,
    provider: 'brevo',
    messageId: result.messageId,
  };
}

export function buildVerificationEmail(email, token) {
  const url = `${CLIENT_URL}/verify-email?token=${token}`;

  return {
    to: email,
    subject: 'Verify your email',
    html: `Please verify your email by clicking: <a href="${url}">${url}</a>`,
    text: `Please verify your email by visiting: ${url}`,
  };
}

export function sendVerificationEmail(email, token) {
  return sendEmail(buildVerificationEmail(email, token));
}

export function buildPasswordResetEmail(email, token) {
  const url = `${CLIENT_URL}/reset-password?token=${token}`;

  return {
    to: email,
    subject: 'Reset your password',
    html: `Reset your password: <a href="${url}">${url}</a>`,
    text: `Reset your password by visiting: ${url}`,
  };
}

export function sendPasswordResetEmail(email, token) {
  return sendEmail(buildPasswordResetEmail(email, token));
}

export function buildProjectInviteEmail(email, token, projectName, inviterName) {
  const url = `${CLIENT_URL}/invites/${token}/accept`;
  const content = `${inviterName} invited you to join ${projectName} on Sprintly`;

  return {
    to: email,
    subject: `Invitation to join ${projectName}`,
    html: `${content}: <a href="${url}">${url}</a>`,
    text: `${content}: ${url}`,
  };
}

export function sendProjectInviteEmail(email, token, projectName, inviterName) {
  return sendEmail(buildProjectInviteEmail(email, token, projectName, inviterName));
}
