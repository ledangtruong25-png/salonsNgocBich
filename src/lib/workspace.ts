import 'server-only';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { WorkspaceData, Role } from './types';
export async function loadWorkspace(client: SupabaseClient, user: User): Promise<WorkspaceData | null> {
  const membership = await client.from('salon_members').select('salon_id,role').eq('user_id',user.id).eq('active',true).maybeSingle();
  if (membership.error) throw new Error('DATABASE_SETUP_REQUIRED');
  if (!membership.data) return null;
  const { salon_id, role } = membership.data;
  if (role !== 'owner' && role !== 'cashier') return null;
  const [salon,profile,customers,services,orders,members] = await Promise.all([
    client.from('salons').select('id,name,phone,address,timezone').eq('id',salon_id).single(),
    client.from('profiles').select('full_name').eq('id',user.id).single(),
    client.from('customers').select('id,full_name,phone,visits,last_visit,is_demo').eq('salon_id',salon_id).order('full_name').limit(100),
    client.from('catalog_items').select('id,name,category,price,duration_minutes,active,is_demo').eq('salon_id',salon_id).order('price').limit(100),
    client.from('orders').select('id,code,customer_name,service_name,check_in,check_out,total,status,is_demo').eq('salon_id',salon_id).order('check_in',{ascending:false}).limit(100),
    role === 'owner' ? client.from('salon_members').select('user_id,role,active,profiles(full_name)').eq('salon_id',salon_id).limit(100) : Promise.resolve({data:[],error:null})
  ]);
  if ([salon,profile,customers,services,orders,members].some(r=>r.error)) throw new Error('WORKSPACE_LOAD_FAILED');
  // Cashiers never receive the team list, including in serialized server props.
  return {
    salon: salon.data!, role: role as Role, userName:profile.data?.full_name || 'Thành viên', email:user.email || '',
    customers: customers.data || [], services:services.data || [], orders: orders.data || [],
    members: (members.data || []).map((m: Record<string,unknown>)=>({user_id:String(m.user_id),role:m.role as Role,active:!!m.active,full_name:(m.profiles as {full_name?: string})?.full_name || 'Thành viên'}))
  };
}
