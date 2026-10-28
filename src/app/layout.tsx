import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Salon Manager · Quản lý salon',
  description: 'Nền tảng chạy thử quản lý salon tóc v0.1.0 với Supabase.',
  robots: { index: false, follow: false }
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
