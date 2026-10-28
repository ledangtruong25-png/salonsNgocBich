import { isPublicKey } from './domain';
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  let validUrl = false;
  try { const parsed = new URL(url); validUrl = parsed.protocol === 'https:' && !url.includes('YOUR_PROJECT'); } catch { /* Unconfigured build is supported. */ }
  return validUrl && isPublicKey(key) ? { url, key } : null;
}
export function appOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return new URL(configured).origin;
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? `https://${host}` : 'http://localhost:3000';
}
