import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth-shell';
import { AuthForm } from '@/components/auth-form';
import { createSupabase } from '@/lib/supabase/server';
import { supabaseEnv } from '@/lib/env';
export const dynamic = 'force-dynamic';
export default async function UpdatePassword() {
  if (!supabaseEnv()) redirect('/setup');
  const client = await createSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/login?error=expired');
  return <AuthShell><div className="auth-card"><span className="eyebrow">BẢO VỆ TÀI KHOẢN</span><h2>Đặt mật khẩu mới</h2><p className="muted">Sử dụng ít nhất 12 ký tự và tránh dùng lại mật khẩu cũ.</p><AuthForm mode="password"/></div></AuthShell>;
}
