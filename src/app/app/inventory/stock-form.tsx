'use client';

import {useState,type FormEvent,type ReactNode} from 'react';
import {useRouter} from 'next/navigation';
import {inventoryAction} from '@/app/inventory-actions';

export function StockForm({kind,children,label}:{kind:Parameters<typeof inventoryAction>[0];children:ReactNode;label:string}) {
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  const [request,setRequest] = useState('');
  const router = useRouter();

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (kind==='stock') {
      const key = request || crypto.randomUUID();
      setRequest(key);
      data.set('request',key);
    }
    setBusy(true);
    setMessage('');
    try {
      const result = await inventoryAction(kind,data);
      setMessage(result.error || 'Đã lưu.');
      if (!result.error) {
        setRequest('');
        if (kind==='stock') form.reset();
        router.refresh();
      }
    } catch {
      setMessage('Kết nối gián đoạn. Kiểm tra lịch sử trước khi mở phiếu mới.');
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="inventory-form">
    <fieldset disabled={busy}>{children}<button className="button primary">{busy?'Đang lưu…':label}</button></fieldset>
    {message&&<p role="status">{message}</p>}
  </form>;
}
