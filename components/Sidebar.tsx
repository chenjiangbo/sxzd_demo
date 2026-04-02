'use client';

import { BotMessageSquare, BrainCircuit, ClipboardList, FileStack, Presentation, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: '代偿补偿', icon: ClipboardList },
  { href: '/brief', label: '担保体系简报', icon: Presentation },
  { href: '/evaluation-report', label: '机构评价报告', icon: BotMessageSquare },
  { href: '/credit-report', label: '授信报告', icon: FileStack },
  { href: '/ai-review', label: 'AI 复核', icon: BrainCircuit },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isCreditRoute = pathname.startsWith('/credit-report');
  const isEvaluationRoute = pathname.startsWith('/evaluation-report');

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-48 flex-col bg-slate-50 font-headline text-sm font-semibold tracking-tight dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-5 dark:border-slate-800/50">
        <span className="block text-lg font-extrabold text-[#002B5B] dark:text-white">代偿补偿Demo</span>
        <span className="text-xs font-medium text-slate-400">单案件流程演示版</span>
      </div>

      <nav className="mt-4 flex-1 space-y-2 px-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            (href === '/' && (pathname === '/' || pathname.startsWith('/cases/') || pathname === '/review' || pathname === '/verify')) ||
            (href === '/brief' && pathname === '/brief') ||
            (href === '/credit-report' && pathname.startsWith('/credit-report')) ||
            (href === '/evaluation-report' && pathname.startsWith('/evaluation-report')) ||
            (href === '/ai-review' && pathname.startsWith('/ai-review'));
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
            <span className="text-xs font-bold text-primary">{isCreditRoute || isEvaluationRoute ? '业务一部 / 授信岗' : '业务一部 / 代偿岗'}</span>
            <span className="text-[10px] text-slate-400">{isCreditRoute || isEvaluationRoute ? '年度授信任务模式' : '单案件审查模式'}</span>
          </div>
        </div>
        <div className="rounded-lg bg-white/70 px-3 py-2 text-[11px] font-medium text-on-surface-variant dark:bg-slate-900/40">
          {isCreditRoute || isEvaluationRoute ? '当前任务：2025 年度合作担保机构再担保业务授信' : '当前演示案件：宝鸡三家村餐饮管理有限公司'}
        </div>
      </div>
    </aside>
  );
}
