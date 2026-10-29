'use server';
import {createSupabase} from '@/lib/supabase/server';
import {revalidatePath} from 'next/cache';
export async function reconcileAction(name:string,args:Record<string,unknown>){
 if(!['open_session','close_session','refund_payment','net_report'].includes(name))return {error:'Thao tác không hợp lệ'};
 try{const c=await createSupabase();const {data,error}=await c.rpc(name,args);if(error)return {error:'Chưa thực hiện được: '+error.message};revalidatePath('/app');return {data};}catch{return {error:'Kết nối gián đoạn. Tải lại để kiểm tra trước khi thử lại.'};}
}
