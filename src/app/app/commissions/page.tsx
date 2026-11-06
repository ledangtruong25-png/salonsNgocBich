import Link from 'next/link';
import Form from 'next/form';
import {redirect} from 'next/navigation';
import {createSupabase} from '@/lib/supabase/server';
import {money} from '@/lib/domain';
import {RateForm} from './rate-form';
import '../inventory/inventory.css';

const size=30;
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
const isoDate=(value:unknown,fallback:string)=>typeof value==='string'&&datePattern.test(value)
  && Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value?value:fallback;
const dateFormat=new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Ho_Chi_Minh'});
const columns=['Thời điểm','Đơn','Thợ','Dịch vụ','Tỷ lệ','Loại','Hoa hồng'];

export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const params=await searchParams;
  const tab=params.tab==='rates'?'rates':'report';
  const page=typeof params.page==='string'&&/^\d{1,5}$/.test(params.page)?Math.max(1,Number(params.page)):1;
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',dateStyle:'short'}).format(new Date());
  const start=isoDate(params.start,today.slice(0,7)+'-01');
  const end=isoDate(params.end,today);
  const from=(page-1)*size;
  const client=await createSupabase();
  const {data:{user}}=await client.auth.getUser();
  if(!user)redirect('/login');
  const {data:member}=await client.from('salon_members').select('salon_id,role').eq('user_id',user.id).eq('active',true).single();
  if(member?.role!=='owner')redirect('/app');
  const salon=member.salon_id;
  const base='/app/commissions';
  const href=(next:number)=>base+'?'+new URLSearchParams({tab,start,end,page:String(next)});
  const pages=(more:boolean)=><nav className="inventory-nav">
    {page>1&&<Link className="button" prefetch={false} href={href(page-1)}>Trang trước</Link>}
    <span>Trang {page}</span>
    {more&&<Link className="button" prefetch={false} href={href(page+1)}>Trang sau</Link>}
  </nav>;
  const errorView=<p role="alert">Chưa tải được hoa hồng. Kiểm tra kết nối và migration 202611060008_commissions.sql.</p>;
  let content;
  if(tab==='rates'){
    const {data,error}=await client.from('catalog_items').select('id,name,variant,commission_rate').eq('salon_id',salon)
      .eq('active',true).eq('is_demo',false).order('name').order('id').range(from,from+size);
    content=error?errorView:<>
      <p>Tỷ lệ tính trên giá trị dịch vụ sau phần giảm giá được phân bổ. Mức 0% sẽ không phát sinh hoa hồng.</p>
      {!data.length&&<p>Chưa có dịch vụ đang bán trên trang này.</p>}
      <div className="inventory-grid">{data.slice(0,size).map(service=><article key={service.id}>
        <h3>{service.name} {service.variant}</h3><RateForm id={service.id} rate={service.commission_rate}/>
      </article>)}</div>{pages(data.length>size)}
    </>;
  }else{
    const days=(Date.parse(end)-Date.parse(start))/86400000;
    if(days<0||days>365||start<'2000-01-01'||end>'2200-12-31'){
      content=<p role="alert">Chọn khoảng thời gian hợp lệ, tối đa 366 ngày.</p>;
    }else{
      const cutoff=new Date(Date.parse(end+'T00:00:00+07:00')+86400000).toISOString();
      const [summary,details]=await Promise.all([
        client.rpc('commission_report',{p_start:start,p_end:end}),
        client.from('commission_entries').select('id,occurred_at,order_code,stylist_name,service_name,rate,refund_id,amount')
          .eq('salon_id',salon).gte('occurred_at',start+'T00:00:00+07:00').lt('occurred_at',cutoff)
          .order('occurred_at',{ascending:false}).order('id',{ascending:false}).range(from,from+size),
      ]);
      const totals=(summary.data??[]) as {stylist_id:string;stylist_name:string;earned:number;reversed:number;net:number}[];
      content=summary.error||details.error?errorView:<>
        <h2>Tổng hợp theo thợ</h2>
        {!totals.length?<p>Chưa có hoa hồng trong kỳ.</p>:<div className="inventory-table"><table>
          <thead><tr><th>Thợ</th><th>Phát sinh</th><th>Giảm do hoàn</th><th>Còn lại</th></tr></thead>
          <tbody>{totals.map(row=><tr key={row.stylist_id}><td>{row.stylist_name}</td><td>{money(row.earned)}</td><td>{money(row.reversed)}</td><td>{money(row.net)}</td></tr>)}</tbody>
        </table></div>}
        <h2>Chi tiết đối soát</h2>
        {!details.data.length&&<p>Chưa có giao dịch trên trang này.</p>}
        <div className="inventory-table"><table><thead><tr>{columns.map(col=><th key={col}>{col}</th>)}</tr></thead>
          <tbody>{details.data.slice(0,size).map(row=><tr key={row.id}>
            <td>{dateFormat.format(new Date(row.occurred_at))}</td><td>{row.order_code}</td><td>{row.stylist_name}</td>
            <td>{row.service_name}</td><td>{row.rate}%</td><td>{row.refund_id?'Hoàn tiền':'Thanh toán'}</td><td>{money(row.amount)}</td>
          </tr>)}</tbody>
        </table></div>{pages(details.data.length>size)}
      </>;
    }
    content=<><Form action={base} className="inventory-nav">
      <label>Từ ngày <input type="date" name="start" required defaultValue={start}/></label>
      <label>Đến ngày <input type="date" name="end" required defaultValue={end}/></label>
      <button className="button primary">Xem kỳ</button>
    </Form><p>Hoa hồng ghi vào ngày thanh toán. Khoản giảm ghi vào ngày hoàn tiền, theo giờ Việt Nam.</p>{content}</>;
  }
  return <main className="setup-page inventory">
    <Link className="button" href="/app">← Quay lại quầy</Link><h1>Hoa hồng thợ</h1>
    <nav className="inventory-nav" aria-label="Điều hướng hoa hồng">
      <Link className="button" prefetch={false} href={base}>Đối soát theo kỳ</Link>
      <Link className="button" prefetch={false} href={base+'?tab=rates'}>Cấu hình tỷ lệ dịch vụ</Link>
    </nav>{content}
  </main>;
}
