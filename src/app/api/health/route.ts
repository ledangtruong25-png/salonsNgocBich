import { supabaseEnv } from '@/lib/env';
export const dynamic = 'force-dynamic';
export function GET() { return Response.json({ status: 'ok', version: '0.1.0', supabaseConfigured: !!supabaseEnv(), databaseVerified: false }, { headers: { 'Cache-Control': 'no-store' } }); }
