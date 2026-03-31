'use client';

import { BotMessageSquare, ClipboardList, FileStack, Gauge, NotebookText, Settings, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '#', label: '首页', icon: Gauge },
  { href: '/', label: '代偿补偿', icon: ClipboardList },
  { href: '/brief', label: '简报', icon: NotebookText },
  { href: '#', label: '文书中心', icon: FileStack },
  { href: '#', label: '审计与风控', icon: ShieldCheck },
  { href: '#', label: '系统管理', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-48 flex-col bg-slate-50 font-headline text-sm font-semibold tracking-tight dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-5 dark:border-slate-800/50">
        <span className="block text-lg font-extrabold text-[#002B5B] dark:text-white">代偿补偿Demo</span>
        <span className="text-xs font-medium text-slate-400">单案件流程演示版</span>
      </div>

      <nav className="mt-4 flex-1 space-y-2 px-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/' && (pathname === '/' || pathname.startsWith('/cases/') || pathname === '/review' || pathname === '/verify');
          return (
            <Link
              key={label}
              href={href}
              className={
                active
                  ? 'flex items-center gap-3 rounded-l-lg border-r-4 border-[#002B5B] bg-white px-3 py-3 font-bold text-[#002B5B] shadow-sm transition-colors dark:bg-slate-800 dark:text-blue-300'
                  : 'flex items-center gap-3 rounded-lg px-3 py-3 text-slate-500 transition-colors hover:bg-surface-container-low hover:text-[#002B5B] dark:text-slate-400 dark:hover:bg-slate-800/80'
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl bg-surface-container-low p-4 dark:bg-slate-800/50">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-white">
            <User className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-primary">业务一部 / 代偿岗</span>
            <span className="text-[10px] text-slate-400">单案件审查模式</span>
          </div>
        </div>
        <div className="rounded-lg bg-white/70 px-3 py-2 text-[11px] font-medium text-on-surface-variant dark:bg-slate-900/40">
          当前演示案件：宝鸡三家村餐饮管理有限公司
        </div>
      </div>
    </aside>
  );
}
