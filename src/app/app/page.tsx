import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabase } from '@/lib/supabase/server';
import { supabaseEnv } from '@/lib/env';
import { loadWorkspace } from '@/lib/workspace';
import { Workspace } from '@/components/workspace';
import { logoutAction } from '@/app/actions';
import type { WorkspaceData } from '@/lib/types';
export const dynamic = 'force-dynamic';
export default async function AppPage() {
  if (!supabaseEnv()) redirect('/setup');
  const client = await createSupabase();
  const auth = await client.auth.getUser();
  if (!auth.data.user) {
    if (auth.error && (!auth.error.status || auth.error.status >= 500)) return <Problem title="Chưa kết nối được Supabase" text="Kiểm tra mạng, trạng thái project hoặc Resume project trong Supabase Dashboard. Thử tải lại sau ít phút."/>;
    redirect('/login');
  }
  let data: WorkspaceData | null;
  try { data = await loadWorkspace(client,auth.data.user); }
  catch { return <Problem title="Database chưa sẵn sàng" text="Đã xác thực tài khoản nhưng chưa đọc được dữ liệu salon. Kiểm tra project có đang tạm dừng và đã chạy migration, bootstrap trong thư mục supabase theo README hay chưa."/>; }
  if (!data) return <Problem title="Tài khoản chưa được cấp quyền" text="Liên hệ chủ salon để thêm thành viên hoặc kích hoạt lại tài khoản trong salon_members. Đăng nhập thành công không tự cấp quyền vào salon."/>;
  return <Workspace data={data} mode="connected"/>;
}
function Problem({title,text}:{title:string;text:string}) {
  return <main className="center-page"><div className="problem-card"><span className="eyebrow">SALON MANAGER · V0.1.0</span><h1>{title}</h1><p className="muted">{text}</p><div className="button-row"><Link className="button primary" href="/app">Thử tải lại</Link><Link className="button" href="/setup">Hướng dẫn cài đặt</Link></div><form action={logoutAction}><button className="text-link">Đăng xuất và đổi tài khoản</button></form></div></main>;
}
