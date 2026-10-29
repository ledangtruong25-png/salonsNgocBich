'use server';
import {createSupabase} from '@/lib/supabase/server';
import {revalidatePath} from 'next/cache';
export async function appointmentAction(name:string,args:Record<string,unknown>){if(!['save_stylist','set_theme','save_appointment','appointment_status'].includes(name))return {error:'Không hợp lệ'};try{const c=await createSupabase();const {data,error}=await c.rpc(name,args);if(error)return {error:error.message.includes('SCHEDULE_CONFLICT')?'Trùng lịch thợ. Nếu vẫn muốn đặt, tích Cho phép trùng và nhập lý do.':error.message};revalidatePath('/app','layout');return {data};}catch{return {error:'Mất kết nối. Tải lại kiểm tra trước khi thử tiếp.'};}}
