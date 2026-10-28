'use client';
import Link from 'next/link';
export default function ErrorPage({reset}:{reset:()=>void}) { return <main className="center-page"><div className="problem-card"><h1>Chưa hoàn tất thao tác</h1><p className="muted">Kết nối có thể đang gián đoạn. Vui lòng thử lại hoặc kiểm tra trạng thái project Supabase.</p><div className="button-row"><button className="button primary" onClick={reset}>Thử lại</button><Link href="/login" className="button">Về đăng nhập</Link></div></div></main>; }
