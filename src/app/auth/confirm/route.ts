import { NextResponse, type NextRequest } from 'next/server';
import { createSupabase } from '@/lib/supabase/server';
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get('token_hash');
  if (token_hash && url.searchParams.get('type') === 'recovery') {
    try {
      const client = await createSupabase();
      const { error } = await client.auth.verifyOtp({ token_hash, type: 'recovery' });
      if (!error) return NextResponse.redirect(new URL('/update-password', url.origin));
    } catch { /* Show a safe retry screen. */ }
  }
  return NextResponse.redirect(new URL('/login?error=expired', url.origin));
}
