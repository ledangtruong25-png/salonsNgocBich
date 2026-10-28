import { NextResponse, type NextRequest } from 'next/server';
import { createSupabase } from '@/lib/supabase/server';
import { safeNext } from '@/lib/domain';
export async function GET(request: NextRequest) {
  const url = new URL(request.url), code = url.searchParams.get('code');
  if (code) {
    try {
      const client = await createSupabase();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(safeNext(url.searchParams.get('next')), url.origin));
    } catch { /* No code, token or provider error is exposed. */ }
  }
  return NextResponse.redirect(new URL('/login?error=expired', url.origin));
}
