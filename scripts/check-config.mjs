const problems=[];
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'';
try { const u=new URL(url); if(u.protocol!=='https:'||url.includes('YOUR_PROJECT'))problems.push('NEXT_PUBLIC_SUPABASE_URL cần là URL HTTPS thật từ Supabase.'); } catch {problems.push('Thiếu hoặc sai NEXT_PUBLIC_SUPABASE_URL.');}
if(key.length<21||key.includes('YOUR_'))problems.push('Thiếu NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (hoặc anon key cũ).');
if(key.startsWith('sb_secret_'))problems.push('KHÔNG dùng secret key ở biến NEXT_PUBLIC. Thay bằng publishable key.');
if(key.startsWith('eyJ')) {
  try { const payload=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()); if(payload.role!=='anon')problems.push('JWT key phải có role anon. Không dùng service_role.'); } catch {problems.push('JWT key không đọc được. Copy lại anon key.');}
}
try {const u=new URL(process.env.NEXT_PUBLIC_APP_URL||'');if(!['http:','https:'].includes(u.protocol))throw new Error();}catch{problems.push('Điền NEXT_PUBLIC_APP_URL bằng localhost hoặc URL HTTPS Vercel.');}
if(problems.length){console.error('Cần kiểm tra cấu hình:\n'+problems.map(p=>' - '+p).join('\n'));process.exitCode=1;}else{console.log('Định dạng cấu hình hợp lệ. Chưa xác minh mạng, Auth hoặc migrations. Đăng nhập app để kiểm tra kết nối thật.');}
