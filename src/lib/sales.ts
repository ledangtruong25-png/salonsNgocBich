import type { Period, Report } from './types.ts';
export function todayVN(date = new Date()):string { return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(date); }
export function toLocalInput(value:string):string { const d=new Date(new Date(value).getTime()+7*3600000);return d.toISOString().slice(0,16); }
export function fromLocalInput(value:string):string { return new Date(value+':00+07:00').toISOString(); }
export function quote(lines:{quantity:number;unit_price:number}[],type:'fixed'|'percent',value:number) {
 if(!lines.length||lines.some(l=>!Number.isInteger(l.quantity)||l.quantity<1||l.quantity>99||!Number.isInteger(l.unit_price)||l.unit_price<0||l.unit_price>100000000)) throw new Error('Dịch vụ hoặc số lượng không hợp lệ.');
 const subtotal=lines.reduce((n,l)=>n+l.quantity*l.unit_price,0);
 if(subtotal>1000000000||!Number.isInteger(value)||value<0||(type==='percent'&&value>100)) throw new Error('Giá trị đơn hoặc giảm giá vượt giới hạn.');
 const discount=type==='percent'?Math.round(subtotal*value/100):value;
 if(discount>subtotal) throw new Error('Giảm giá vượt quá tạm tính.');
 return {subtotal,discount,total:subtotal-discount};
}
export function emptyReport(period:Period='day'):Report { return {start:'',end:'',period,revenue:0,orders:0,discount:0,cash:0,transfer:0,series:[],services:[]}; }
export function reportCsv(report:Report):string {
 const cell=(x:unknown)=>'"'+String(x).replaceAll('"','""')+'"';
 return '\uFEFF'+[['Thời điểm (giờ Việt Nam)','Số đơn','Doanh thu VND'],...report.series.map(s=>[s.time,s.orders,s.revenue])].map(r=>r.map(cell).join(',')).join('\r\n');
}
