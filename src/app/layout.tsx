import type { Metadata } from 'next';
import './globals.css';
import { PwaRegister } from '@/components/pwa';
export const viewport = { themeColor: '#285a45' };
export const metadata: Metadata = {
  title: 'Salon Manager · Quản lý salon',
  description: 'Quản lý salon tóc v1.1.0: đơn hàng, thanh toán, in phiếu và báo cáo.',
  appleWebApp: { capable: true, title: 'Salon Manager', statusBarStyle: 'default' },
  icons: { apple: '/pwa-192.png' },
  robots: { index: false, follow: false }
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body><PwaRegister/>{children}</body></html>;
}
