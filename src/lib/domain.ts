export function safeNext(value: string | null | undefined): string {
  return value === '/update-password' ? value : '/app';
}
export function validEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
export function validPassword(value: string): boolean {
  return value.length >= 12 && value.length <= 128;
}
export function money(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}
export function vietnamDate(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
}
export function vietnamTime(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}
export function summarize(orders: { total: number; status: string }[]) {
  return {
    completed: orders.filter(o => o.status === 'completed').length,
    serving: orders.filter(o => o.status === 'serving').length,
    value: orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0),
    visits: orders.filter(o => o.status !== 'cancelled').length
  };
}
export function settingsInput(input: { name: string; phone: string; address: string }) {
  const name = input.name.trim(), phone = input.phone.trim(), address = input.address.trim();
  if (name.length < 2 || name.length > 100) return { error: 'Tên salon cần từ 2 đến 100 ký tự.' };
  if (phone.length > 24 || (phone && !/^[+\d\s().-]+$/.test(phone))) return { error: 'Số điện thoại chưa đúng định dạng.' };
  if (address.length > 250) return { error: 'Địa chỉ tối đa 250 ký tự.' };
  return { value: { name, phone, address } };
}
export function isPublicKey(key: string): boolean {
  if (key.startsWith('sb_publishable_') && key.length > 20) return true;
  if (key.startsWith('eyJ')) {
    try { return JSON.parse(atob(key.split('.')[1].replaceAll('-','+').replaceAll('_','/'))).role === 'anon'; }
    catch { return false; }
  }
  return false;
}
