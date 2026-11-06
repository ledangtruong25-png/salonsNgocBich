'use server';

import {createSupabase} from '@/lib/supabase/server';

export async function saveCommissionRate(id:string,rate:string){
  if(!/^\d{1,3}(\.\d{1,2})?$/.test(rate)||Number(rate)>100)return 'Tỷ lệ hợp lệ từ 0 đến 100%.';
  const client=await createSupabase();
  const {error}=await client.rpc('set_commission_rate',{p_catalog:id,p_rate:rate});
  if(error?.message==='FORBIDDEN')return 'Chỉ chủ salon được đổi tỷ lệ.';
  return error?'Chưa lưu được tỷ lệ. Kiểm tra kết nối, dịch vụ và migration v1.5.0.':'Đã lưu tỷ lệ cho lần thanh toán sau.';
}
