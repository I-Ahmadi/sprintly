import path from 'path';

export const PORT = process.env.PORT || 3000;
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const renderUrl = process.env.RENDER_EXTERNAL_HOSTNAME
  ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`
  : null;
export const CLIENT_URL = process.env.CLIENT_URL || renderUrl || 'http://localhost:5173';

const configuredOrigins = (process.env.ALLOWED_ORIGINS || CLIENT_URL)
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

export function isOriginAllowed(origin) {
  if (!origin) return true;

  const normalizedOrigin = origin.replace(/\/$/, '');
  const isLocalOrigin = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(normalizedOrigin);

  return isLocalOrigin || configuredOrigins.includes(normalizedOrigin);
}

export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_ACCESS_EXPIRES_IN',
    'JWT_REFRESH_EXPIRES_IN',
    'JWT_REFRESH_EXPIRES_MS',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.JWT_REFRESH_EXPIRES_MS && Number.isNaN(Number(process.env.JWT_REFRESH_EXPIRES_MS))) {
    throw new Error('JWT_REFRESH_EXPIRES_MS must be a number of milliseconds.');
  }
}
