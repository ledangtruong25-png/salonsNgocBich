'use server';

import {createSupabase} from '@/lib/supabase/server';

const messages: Record<string,string> = {
  FORBIDDEN: 'Chỉ chủ salon được thao tác kho.',
  NOT_FOUND: 'Không tìm thấy vật tư hoặc dịch vụ trong salon.',
  INVALID_STOCK: 'Kiểm tra số lượng và lý do ghi kho.',
  INVALID_QUANTITY: 'Kiểm tra số lượng định mức.',
  STALE_STOCK: 'Tồn đã thay đổi. Mở lại vật tư và kiểm tra số đếm trước khi lưu.',
  REQUEST_CONFLICT: 'Mã thao tác đã được dùng. Mở lại phiếu trước khi ghi tiếp.',
  '23505': 'Tên vật tư đã tồn tại.',
};

export async function inventoryAction(kind: 'material' | 'stock' | 'recipe', form: FormData) {
  const value = (key: string) => String(form.get(key) ?? '').trim();
  const numeric = (key: string) => /^\d{1,12}(\.\d{1,3})?$/.test(value(key)) ? value(key) : null;
  const calls = {
    material: ['save_material', {p_id:value('material') || null,p_name:value('name'),p_unit:value('unit'),p_minimum:numeric('minimum')}],
    stock: ['record_stock', {p_request:value('request'),p_material:value('material'),p_kind:value('kind'),p_quantity:numeric('quantity'),p_note:value('note'),p_expected:value('expected')}],
    recipe: ['set_service_material', {p_catalog:value('catalog'),p_material:value('material'),p_quantity:numeric('quantity')}],
  } as const;
  if (!Object.hasOwn(calls,kind)) return {error:'Thao tác không hợp lệ.'};
  try {
    const client = await createSupabase();
    const [rpc,args] = calls[kind];
    const {error} = await client.rpc(rpc,args);
    if (error) return {error:messages[error.message] ?? messages[error.code] ?? 'Chưa lưu được. Kiểm tra dữ liệu và trạng thái cài đặt kho.'};
    return {error:''};
  } catch {
    return {error:'Kết nối gián đoạn. Kiểm tra lịch sử trước khi mở phiếu mới.'};
  }
}
