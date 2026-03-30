import type {Metadata} from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

export const metadata: Metadata = {
  title: '代偿补偿系统',
  description: '代偿补偿案件审核中心',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${manrope.variable}`}>
      <body className="antialiased bg-surface text-on-surface min-h-screen flex" suppressHydrationWarning>{children}</body>
    </html>
  );
}
