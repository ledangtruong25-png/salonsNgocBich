import Link from 'next/link';
import {redirect} from 'next/navigation';
import {createSupabase} from '@/lib/supabase/server';
import {StockForm} from './stock-form';
import './inventory.css';

const PAGE_SIZE = 30;
const units = ['ml','g','chai','cái','hộp'];
const number = new Intl.NumberFormat('vi-VN',{maximumFractionDigits:3});
const date = new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Ho_Chi_Minh'});
const labels: Record<string,string> = {sale:'Tiêu hao',receipt:'Nhập kho',count:'Kiểm kê'};
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function Quantity({name,label,initial,min=0}:{name:string;label:string;initial?:number;min?:number}) {
  return <label>{label}<input name={name} type="number" required step="0.001" min={min} max={999999999999} defaultValue={initial}/></label>;
}

export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const params = await searchParams;
  const tab = params.tab==='history'?'history':params.tab==='recipe'?'recipe':'stock';
  const page = typeof params.page==='string'&&/^\d{1,5}$/.test(params.page)?Math.max(1,Number(params.page)):1;
  const material = typeof params.material==='string'&&uuid.test(params.material)?params.material:'';
  const client = await createSupabase();
  const {data:{user}} = await client.auth.getUser();
  if (!user) redirect('/login');
  const {data:membership} = await client.from('salon_members').select('salon_id,role').eq('user_id',user.id).eq('active',true).single();
  if (membership?.role!=='owner') redirect('/app');
  const salon = membership.salon_id;
  const start = (page-1)*PAGE_SIZE;
  const href = (target:string,p=1,id='') => '/app/inventory?'+new URLSearchParams({tab:target,page:String(p),...(id?{material:id}:{})});
  const pagination = (more:boolean) => <nav className="inventory-nav">
    {page>1&&<Link className="button" href={href(tab,page-1,material)}>Trang trước</Link>}
    <span>Trang {page}</span>
    {more&&<Link className="button" href={href(tab,page+1,material)}>Trang sau</Link>}
  </nav>;
  let content;
  const failure = <p role="alert">Chưa tải được dữ liệu kho. Kiểm tra kết nối và migration 202611060007_inventory.sql.</p>;

  if (tab==='history') {
    const {data,error} = await client.from('stock_movements').select('id,kind,delta,balance,created_at,note,payment_id,materials(name,unit)')
      .eq('salon_id',salon).order('created_at',{ascending:false}).order('id',{ascending:false}).range(start,start+PAGE_SIZE);
    content = error?failure:<>
      {!data.length&&<p>Chưa có giao dịch trên trang này.</p>}
      <div className="inventory-table"><table><thead><tr><th>Thời điểm</th><th>Vật tư</th><th>Loại</th><th>Thay đổi</th><th>Tồn sau</th><th>Ghi chú</th></tr></thead>
      <tbody>{data.slice(0,PAGE_SIZE).map(row=>{
        const item = Array.isArray(row.materials)?row.materials[0]:row.materials;
        return <tr key={row.id}><td>{date.format(new Date(row.created_at))}</td><td>{item?.name}</td><td>{labels[row.kind]}</td><td>{number.format(row.delta)} {item?.unit}</td><td>{number.format(row.balance)}</td><td>{row.note||row.payment_id||'—'}</td></tr>;
      })}</tbody></table></div>{pagination(data.length>PAGE_SIZE)}</>;
  } else if (tab==='recipe'&&material) {
    const [item,services] = await Promise.all([
      client.from('materials').select('name,unit').eq('salon_id',salon).eq('id',material).maybeSingle(),
      client.from('catalog_items').select('id,name,variant,service_materials(quantity)').eq('salon_id',salon).eq('active',true).eq('is_demo',false)
        .eq('service_materials.material_id',material).order('name').order('id').range(start,start+PAGE_SIZE),
    ]);
    const unit = item.data?.unit;
    content = item.error||services.error?failure:!item.data?<p>Không tìm thấy vật tư.</p>:<>
      <h2>Định mức {item.data.name} ({item.data.unit})</h2>
      <p>Nhập lượng dùng cho một lượt dịch vụ. Lưu 0 để bỏ định mức.</p>
      {!services.data.length&&<p>Chưa có dịch vụ đang bán trên trang này.</p>}
      <div className="inventory-grid">{services.data.slice(0,PAGE_SIZE).map(service=><article key={service.id}>
        <h3>{service.name} {service.variant}</h3>
        <StockForm kind="recipe" label="Lưu định mức">
          <input type="hidden" name="material" value={material}/><input type="hidden" name="catalog" value={service.id}/>
          <Quantity name="quantity" label={`Lượng dùng (${unit})`} initial={service.service_materials[0]?.quantity ?? 0}/>
        </StockForm>
      </article>)}</div>{pagination(services.data.length>PAGE_SIZE)}</>;
  } else {
    let query = client.from('materials').select('id,name,unit,stock,minimum').eq('salon_id',salon);
    if (material) query=query.eq('id',material);
    const {data,error} = await query.order('name').order('id').range(material?0:start,material?0:start+PAGE_SIZE);
    content = error?failure:<>
      {!material&&<details className="inventory-panel"><summary>Thêm vật tư</summary>
        <StockForm kind="material" label="Tạo vật tư">
          <label>Tên vật tư<input name="name" required maxLength={100}/></label>
          <label>Đơn vị<select name="unit">{units.map(unit=><option key={unit}>{unit}</option>)}</select></label>
          <Quantity name="minimum" label="Tồn tối thiểu" initial={0}/>
        </StockForm>
      </details>}
      {!data.length&&<p>Chưa có vật tư trên trang này.</p>}
      <div className="inventory-grid">{data.slice(0,PAGE_SIZE).map(item=><article key={item.id}>
        <h3>{item.name}</h3>
        <p>Tồn <strong>{number.format(item.stock)} {item.unit}</strong> · Mức tối thiểu {number.format(item.minimum)}</p>
        {item.stock<=item.minimum&&<p className="inventory-low">{item.stock<0?'Tồn âm':'Đến mức cần bổ sung'}</p>}
        <nav className="inventory-nav">
          {!material&&<Link className="button" prefetch={false} href={href('stock',1,item.id)}>Thao tác kho</Link>}
          <Link className="button" prefetch={false} href={href('recipe',1,item.id)}>Định mức dịch vụ</Link>
        </nav>
        {material&&<>
          <details><summary>Nhập kho</summary><StockForm kind="stock" label="Ghi nhập kho">
            <input type="hidden" name="material" value={item.id}/><input type="hidden" name="kind" value="receipt"/>
            <input type="hidden" name="expected" value={item.stock}/>
            <Quantity name="quantity" label={`Số lượng nhập (${item.unit})`} min={0.001}/>
            <label>Lý do / chứng từ<input name="note" required maxLength={250}/></label>
          </StockForm></details>
          <details><summary>Kiểm kê</summary><StockForm kind="stock" label="Ghi kiểm kê">
            <input type="hidden" name="material" value={item.id}/><input type="hidden" name="kind" value="count"/>
            <input type="hidden" name="expected" value={item.stock}/>
            <Quantity name="quantity" label={`Số đếm thực tế (${item.unit})`}/>
            <label>Lý do kiểm kê<input name="note" required maxLength={250}/></label>
          </StockForm></details>
          <details><summary>Sửa tên và mức cảnh báo</summary><StockForm kind="material" label="Lưu vật tư">
            <input type="hidden" name="material" value={item.id}/>
            <label>Tên vật tư<input name="name" required maxLength={100} defaultValue={item.name}/></label>
            <Quantity name="minimum" label="Tồn tối thiểu" initial={item.minimum}/>
          </StockForm></details>
        </>}
      </article>)}</div>{!material&&pagination(data.length>PAGE_SIZE)}</>;
  }

  return <main className="setup-page inventory">
    <Link className="button" href="/app">← Quay lại quầy</Link>
    <h1>Kho vật tư</h1>
    <nav aria-label="Điều hướng kho" className="inventory-nav">
      <Link className="button" href={href('stock')}>Danh sách vật tư</Link>
      {material&&<Link className="button" href={href('stock',1,material)}>Chi tiết vật tư</Link>}
      <Link className="button" href={href('history')}>Lịch sử kho</Link>
    </nav>
    {content}
  </main>;
}
