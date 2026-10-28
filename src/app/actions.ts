'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabase } from '@/lib/supabase/server';
import { supabaseEnv, appOrigin } from '@/lib/env';
import { validEmail, validPassword, settingsInput } from '@/lib/domain';
import type { ActionState } from '@/lib/types';

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  if (!supabaseEnv()) return { error: 'Chưa cấu hình Supabase. Mở Hướng dẫn cài đặt để kết nối.' };
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  if (!validEmail(email) || password.length < 1 || password.length > 128) return { error: 'Kiểm tra lại email và mật khẩu.' };
  try {
    const client = await createSupabase();
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { error: error.status === 429 ? 'Quá nhiều lần thử. Vui lòng đợi rồi đăng nhập lại.' : 'Đăng nhập chưa thành công. Kiểm tra email, mật khẩu và trạng thái tài khoản.' };
  } catch { return { error: 'Chưa kết nối được Supabase. Kiểm tra mạng hoặc trạng thái project.' }; }
  redirect('/app');
}
export async function logoutAction() {
  const client = await createSupabase();
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw new Error('Chưa đăng xuất được. Vui lòng thử lại.');
  redirect('/login');
}
export async function resetAction(_: ActionState, form: FormData): Promise<ActionState> {
  if (!supabaseEnv()) return { error: 'Cần cấu hình Supabase trước khi gửi email.' };
  const email = String(form.get('email') || '').trim();
  if (!validEmail(email)) return { error: 'Nhập email hợp lệ.' };
  try {
    const client = await createSupabase();
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${appOrigin()}/auth/callback?next=/update-password` });
    if (error) return { error: 'Chưa gửi được email. Thử lại sau hoặc nhờ chủ project kiểm tra cấu hình email và hạn mức gửi.' };
  } catch { return { error: 'Chưa kết nối được dịch vụ gửi email. Vui lòng thử lại.' }; }
  return { success: 'Nếu email có tài khoản hợp lệ, hướng dẫn đặt lại mật khẩu sẽ được gửi. Kiểm tra cả thư rác.' };
}
export async function passwordAction(_: ActionState, form: FormData): Promise<ActionState> {
  const password = String(form.get('password') || '');
  if (!validPassword(password)) return { error: 'Mật khẩu mới cần từ 12 đến 128 ký tự.' };
  if (password !== form.get('confirm')) return { error: 'Hai mật khẩu chưa khớp.' };
  try {
    const client = await createSupabase();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return { error: 'Liên kết đã hết hạn. Gửi lại yêu cầu đặt mật khẩu.' };
    const { error } = await client.auth.updateUser({ password });
    if (error) return { error: 'Chưa đổi được mật khẩu. Có thể mật khẩu trùng mật khẩu cũ hoặc phiên xác thực đã hết hạn.' };
  } catch { return { error: 'Chưa kết nối được Supabase. Vui lòng thử lại.' }; }
  redirect('/app');
}
export async function settingsAction(_: ActionState, form: FormData): Promise<ActionState> {
  const input = settingsInput({ name: String(form.get('name') || ''), phone: String(form.get('phone') || ''), address: String(form.get('address') || '') });
  if (input.error) return { error: input.error };
  try {
    const client = await createSupabase();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return { error: 'Phiên đăng nhập hết hạn. Đăng nhập lại để lưu.' };
    const { data: member } = await client.from('salon_members').select('salon_id,role,active').eq('user_id', user.id).eq('active', true).single();
    if (!member || member.role !== 'owner') return { error: 'Chỉ chủ salon được sửa thông tin.' };
    const { data, error } = await client.from('salons').update(input.value!).eq('id', member.salon_id).select('id');
    if (error || !data?.length) return { error: 'Chưa lưu được. Kiểm tra quyền và trạng thái database.' };
  } catch { return { error: 'Kết nối gián đoạn. Vui lòng tải lại rồi thử lưu.' }; }
  revalidatePath('/app');
  return { success: 'Đã lưu thông tin salon trên Supabase.' };
}
