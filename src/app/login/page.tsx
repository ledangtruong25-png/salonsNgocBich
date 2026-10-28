import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { AuthForm } from '@/components/auth-form';
import { supabaseEnv } from '@/lib/env';
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const ready = !!supabaseEnv(), params = await searchParams;
  return <AuthShell><div className="auth-card"><span className="eyebrow">CHÀO MỪNG TRỞ LẠI</span><h2>Đăng nhập salon</h2><p className="muted">Sử dụng tài khoản được chủ salon cấp để tiếp tục.</p>{!ready && <div className="notice">Chưa kết nối database. <Link href="/setup">Xem hướng dẫn cấu hình</Link> hoặc <Link href="/demo">xem giao diện mẫu</Link>.</div>}{params.error === 'expired' && <div className="notice danger" role="alert">Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại yêu cầu đặt mật khẩu.</div>}<AuthForm configured={ready}/><Link href="/forgot-password" className="forgot-link">Quên mật khẩu?</Link><div className="auth-divider"/><p className="small muted">Chưa có tài khoản? Liên hệ chủ salon. Ứng dụng không mở đăng ký công khai.</p><Link className="text-link" href="/demo">Xem thử bằng dữ liệu mẫu →</Link></div></AuthShell>;
}
