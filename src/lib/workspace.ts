import 'server-only';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { WorkspaceData, Role, Service } from './types';
import { todayVN } from './sales';
export async function loadWorkspace(client:SupabaseClient,user:User):Promise<WorkspaceData|null> {
 const membership=await client.from('salon_members').select('salon_id,role').eq('user_id',user.id).eq('active',true).maybeSingle();
 if(membership.error)throw new Error('DATABASE_SETUP_REQUIRED');if(!membership.data)return null;
 const {salon_id,role}=membership.data;if(!['owner','cashier'].includes(role))return null;
 const [salon,profile,customers,orders,members,report,serving]=await Promise.all([
 client.from('salons').select('*').eq('id',salon_id).single(),client.from('profiles').select('full_name').eq('id',user.id).single(),
 client.from('customers').select('*',{count:'exact'}).eq('salon_id',salon_id).eq('is_demo',false).order('full_name').order('id').range(0,24),
 client.from('orders').select('*',{count:'exact'}).eq('salon_id',salon_id).eq('is_demo',false).order('check_in',{ascending:false}).order('id').range(0,24),
 role==='owner'?client.from('salon_members').select('user_id,role,active,profiles(full_name)').eq('salon_id',salon_id):Promise.resolve({data:[],error:null}),
 client.rpc('sales_report',{p_period:'day',p_date:todayVN()}),
 client.from('orders').select('id',{count:'exact',head:true}).eq('salon_id',salon_id).eq('is_demo',false).eq('status','serving')]);
 if([salon,profile,customers,orders,members,report,serving].some(r=>r.error))throw new Error('WORKSPACE_LOAD_FAILED');
 // Page through the catalog: Supabase's response row cap must not silently omit services.
 const services:Service[]=[];
 for(let start=0;;start+=500){const r=await client.from('catalog_items').select('*').eq('salon_id',salon_id).eq('is_demo',false).order('name').order('id').range(start,start+499);if(r.error)throw new Error('CATALOG_LOAD_FAILED');services.push(...r.data);if(r.data.length<500)break;}
 return {salon:salon.data,role:role as Role,userName:profile.data?.full_name||'Thành viên',email:user.email||'',customers:customers.data||[],customerCount:customers.count||0,services,orders:orders.data||[],orderCount:orders.count||0,servingCount:serving.count||0,report:report.data,
 members:(members.data||[]).map((m:Record<string,unknown>)=>({user_id:String(m.user_id),role:m.role as Role,active:!!m.active,full_name:(m.profiles as {full_name?:string})?.full_name||'Thành viên'}))};
}
