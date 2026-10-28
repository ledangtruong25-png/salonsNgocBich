'use client';
import { useActionState } from 'react';
import { Save, LoaderCircle } from 'lucide-react';
import { settingsAction } from '@/app/actions';
import type { Salon } from '@/lib/types';
export function SettingsForm({ salon, editable, demo }: { salon: Salon; editable: boolean; demo: boolean }) {
  const [state, action, pending] = useActionState(settingsAction, {});
  return <form action={action} className="settings-form">
    <label>Tên salon<input name="name" defaultValue={salon.name} required minLength={2} maxLength={100} disabled={!editable || demo}/></label>
    <div className="form-grid"><label>Số điện thoại<input name="phone" defaultValue={salon.phone} type="tel" maxLength={24} placeholder="Chưa thêm số điện thoại" disabled={!editable || demo}/></label><label>Múi giờ<input value="Giờ Việt Nam · UTC+7" disabled readOnly/></label></div>
    <label>Địa chỉ<input name="address" defaultValue={salon.address} maxLength={250} disabled={!editable || demo}/></label>
    {state.error && <div className="notice danger" role="alert">{state.error}</div>}
    {state.success && <div className="notice success" role="status">{state.success}</div>}
    <div className="settings-save"><span className="small muted">{demo ? 'Đăng nhập với Supabase để lưu thay đổi.' : editable ? 'Thay đổi được lưu cho toàn bộ salon.' : 'Chỉ chủ salon được sửa thông tin này.'}</span><button className="button primary" type="submit" disabled={!editable || demo || pending}>{pending ? <LoaderCircle size={16} className="spin"/> : <Save size={16}/>}Lưu thông tin</button></div>
  </form>;
}
