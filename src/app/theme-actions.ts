'use server';
import {createSupabase} from '@/lib/supabase/server';import {revalidatePath} from 'next/cache';import type {Theme} from '@/lib/theme';
export async function saveAppearance(theme:Theme){try{const c=await createSupabase();const {error}=await c.rpc('set_appearance',{p_theme:theme});if(error)return {error:'Chưa lưu được. Kiểm tra quyền chủ salon, migration v1.2.1 và kết nối database.'};revalidatePath('/app','layout');return {success:true};}catch{return {error:'Kết nối gián đoạn. Tải lại để kiểm tra thay đổi.'};}}
