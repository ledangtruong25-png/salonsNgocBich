import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { AuthForm } from '@/components/auth-form';
import { supabaseEnv } from '@/lib/env';
export default function Forgot() { return <AuthShell><div className="auth-card"><span className="eyebrow">KHÔI PHỤC TÀI KHOẢN</span><h2>Quên mật khẩu?</h2><p className="muted">Nhập email đã được cấp. Bạn sẽ nhận được hướng dẫn đặt lại mật khẩu nếu tài khoản hợp lệ.</p>{!supabaseEnv() && <div className="notice">Cần <Link href="/setup">cấu hình Supabase</Link> trước khi gửi email.</div>}<AuthForm mode="reset" configured={!!supabaseEnv()}/><Link href="/login" className="text-link">← Trở lại đăng nhập</Link><p className="small muted">Email thử nghiệm của Supabase có giới hạn. Nếu không nhận được thư, nhờ chủ project kiểm tra Authentication và cấu hình SMTP.</p></div></AuthShell>; }
