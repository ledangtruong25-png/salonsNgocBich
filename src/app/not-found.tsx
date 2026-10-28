import Link from 'next/link';
export default function NotFound() { return <main className="center-page"><div className="problem-card"><span className="eyebrow">404</span><h1>Không tìm thấy trang</h1><p className="muted">Đường dẫn có thể đã thay đổi.</p><Link href="/" className="button primary">Về Salon Manager</Link></div></main>; }
