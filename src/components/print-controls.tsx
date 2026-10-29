'use client';
export function PrintControls(){return <div className="print-controls"><button onClick={()=>window.print()}>In / Lưu PDF</button><button onClick={()=>window.close()}>Đóng cửa sổ</button><p>Chọn đúng khổ K80 (80 mm) hoặc A4 trong trình điều khiển máy in. Tắt Headers and footers; tỷ lệ 100%.</p></div>;}
