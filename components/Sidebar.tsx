'use client';

import { BotMessageSquare, BrainCircuit, ChevronRight, ClipboardList, FileStack, Presentation, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const topLevelItems = [
  { href: '/brief', label: '担保体系简报', icon: Presentation },
  { href: '/evaluation-report', label: '机构评价报告', icon: BotMessageSquare },
  { href: '/credit-report', label: '授信报告', icon: FileStack },
  { href: '/prompt-letter', label: '综合评价提示函', icon: BotMessageSquare },
  { href: '/ai-review', label: 'AI 复核', icon: BrainCircuit },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isCreditRoute = pathname.startsWith('/credit-report');
  const isEvaluationRoute = pathname.startsWith('/evaluation-report');
  const compensationParentActive = pathname === '/' || pathname.startsWith('/cases/') || pathname === '/review' || pathname === '/verify' || pathname.startsWith('/compensation-brief');
  const approvalActive = pathname === '/' || pathname.startsWith('/cases/') || pathname === '/review' || pathname === '/verify';
  const compensationBriefActive = pathname.startsWith('/compensation-brief');

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-48 flex-col bg-slate-50 font-headline text-sm font-semibold tracking-tight text-slate-700">
      <div className="border-b border-slate-100 px-4 py-5">
        <span className="block text-lg font-extrabold text-[#002B5B]">代偿补偿Demo</span>
        <span className="text-xs font-medium text-slate-500">单案件流程演示版</span>
      </div>

      <nav className="mt-4 flex-1 space-y-2 px-3">
        <div className="space-y-1">
          <div
            className={
              compensationParentActive
                ? 'flex items-center gap-3 rounded-l-lg border-r-4 border-[#002B5B] bg-white px-3 py-3 font-bold text-[#002B5B] shadow-sm transition-colors'
                : 'flex items-center gap-3 rounded-lg px-3 py-3 text-slate-600 transition-colors'
            }
          >
            <ClipboardList className="h-5 w-5" />
            <span>代偿补偿</span>
          </div>
          <div className="ml-5 space-y-1 border-l border-slate-200 pl-3">
            <Link
              href="/"
              className={
                approvalActive
                  ? 'flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-[#002B5B]'
                  : 'flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-surface-container-low hover:text-[#002B5B]'
              }
            >
              <ChevronRight className="h-3.5 w-3.5" />
              <span>审批表</span>
            </Link>
            <Link
              href="/compensation-brief"
              className={
                compensationBriefActive
                  ? 'flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-[#002B5B]'
                  : 'flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-surface-container-low hover:text-[#002B5B]'
              }
            >
              <ChevronRight className="h-3.5 w-3.5" />
              <span>简报</span>
            </Link>
          </div>
        </div>

        {topLevelItems.map(({ href, label, icon: Icon }) => {
          const active =
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
                  ? 'flex items-center gap-3 rounded-l-lg border-r-4 border-[#002B5B] bg-white px-3 py-3 font-bold text-[#002B5B] shadow-sm transition-colors'
                  : 'flex items-center gap-3 rounded-lg px-3 py-3 text-slate-600 transition-colors hover:bg-surface-container-low hover:text-[#002B5B]'
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl bg-surface-container-low p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-white">
            <User className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-primary">{isCreditRoute || isEvaluationRoute ? '业务一部 / 授信岗' : '业务一部 / 代偿岗'}</span>
            <span className="text-[10px] text-slate-500">{isCreditRoute || isEvaluationRoute ? '年度授信任务模式' : '单案件审查模式'}</span>
          </div>
        </div>
        <div className="rounded-lg bg-white/80 px-3 py-2 text-[11px] font-medium text-on-surface-variant">
          {isCreditRoute || isEvaluationRoute ? '当前任务：2025 年度合作担保机构再担保业务授信' : '当前演示案件：宝鸡三家村餐饮管理有限公司'}
        </div>
      </div>
    </aside>
  );
}
