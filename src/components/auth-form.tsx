'use client';
import { useActionState, useState } from 'react';
import { Eye, EyeOff, ArrowRight, LoaderCircle } from 'lucide-react';
import { loginAction, resetAction, passwordAction } from '@/app/actions';
export function AuthForm({ mode = 'login', configured = true }: { mode?: 'login' | 'reset' | 'password'; configured?: boolean }) {
  const action = mode === 'reset' ? resetAction : mode === 'password' ? passwordAction : loginAction;
  const [state, formAction, pending] = useActionState(action, {});
  const [show, setShow] = useState(false);
  return <form action={formAction} className="auth-form">
    {mode !== 'password' && <label>Email<input name="email" type="email" placeholder="ban@salon.vn" required autoComplete="email" maxLength={254} /></label>}
    {mode !== 'reset' && <label>{mode === 'password' ? 'Mật khẩu mới' : 'Mật khẩu'}<span className="password-field"><input name="password" type={show ? 'text' : 'password'} required minLength={mode === 'password' ? 12 : 1} maxLength={128} autoComplete={mode === 'password' ? 'new-password' : 'current-password'} placeholder={mode === 'password' ? 'Tối thiểu 12 ký tự' : 'Nhập mật khẩu của bạn'} /><button type="button" aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShow(!show)}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label>}
    {mode === 'password' && <label>Nhập lại mật khẩu<input name="confirm" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label>}
    {state.error && <div className="notice danger" role="alert">{state.error}</div>}
    {state.success && <div className="notice success" role="status">{state.success}</div>}
    <button className="button primary full" disabled={pending || !configured} type="submit">{pending ? <><LoaderCircle size={18} className="spin"/>Đang xử lý…</> : <>{mode === 'reset' ? 'Gửi hướng dẫn đặt lại' : mode === 'password' ? 'Lưu mật khẩu mới' : 'Đăng nhập'}<ArrowRight size={18}/></>}</button>
  </form>;
}
