'use client';

import {useState,type FormEvent} from 'react';
import {saveCommissionRate} from './actions';

export function RateForm({id,rate}:{id:string;rate:number}) {
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy)return;
    const value=String(new FormData(event.currentTarget).get('rate')??'');
    setBusy(true);
    setMessage('');
    try {setMessage(await saveCommissionRate(id,value));}
    catch {setMessage('Kết nối gián đoạn. Tải lại để kiểm tra tỷ lệ đã lưu.');}
    finally {setBusy(false);}
  }
  return <form className="inventory-form" onSubmit={submit}><fieldset disabled={busy}>
    <label>Tỷ lệ hoa hồng (%)<input name="rate" type="number" min={0} max={100} step="0.01" required defaultValue={rate}/></label>
    <button className="button primary">{busy?'Đang lưu…':'Lưu tỷ lệ'}</button>
  </fieldset>{message&&<p role="status">{message}</p>}</form>;
}
