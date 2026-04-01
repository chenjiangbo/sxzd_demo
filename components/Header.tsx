'use client';

import { Bell, BookOpenText, Bot, Grid2X2, HelpCircle, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { AI_ASSISTANT_TOGGLE_EVENT } from '@/lib/ai-assistant-events';
import { CREDIT_POLICY_OPEN_EVENT } from '@/components/credit/PolicyTopicButton';

const titleMap: Record<string, string> = {
  '/': '代偿补偿',
  '/cases/workbench': '案件处理工作台',
  '/credit-report': '年度授信任务',
  '/credit-report/analysis': 'AI 授信结论归纳',
  '/credit-report/report': '授信报告成文预览',
};

export default function Header() {
  const pathname = usePathname();
  const currentTitle = titleMap[pathname] ?? '代偿补偿';
  const showSearch = pathname === '/';
  const isCreditRoute = pathname.startsWith('/credit-report');

  if (isCreditRoute) {
    return (
      <header className="fixed left-48 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/20 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-6">
          <span className="text-lg font-black text-blue-950">Guarantee Platform</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Global Search"
              className="w-56 rounded-full border-none bg-surface-container py-1.5 pl-9 pr-4 text-xs outline-none ring-blue-500/20 transition focus:ring-2"
            />
          </div>
        </div>

        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent(CREDIT_POLICY_OPEN_EVENT, { detail: { topic: 'credit_formula' } }))}
            className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-black text-primary transition hover:bg-surface-container"
          >
            <BookOpenText className="h-3.5 w-3.5 text-on-tertiary-container" />
            制度助手
          </button>
          <div className="flex items-center gap-4 border-r border-slate-200 pr-5">
            <button className="text-slate-500 transition hover:text-blue-600">
              <Bell className="h-3.5 w-3.5" />
            </button>
            <button className="text-slate-500 transition hover:text-blue-600">
              <Grid2X2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-primary">Chief Analyst</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Risk Department</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-highest text-[11px] font-black text-primary">CA</div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      data-page-header="true"
      className="fixed top-0 right-0 left-48 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white/85 px-6 shadow-sm backdrop-blur-md transition-[right] duration-200 dark:border-slate-800/50 dark:bg-slate-950/80"
    >
      <div className="flex items-center gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">Compensation Workflow</p>
          <h1 className="font-headline text-lg font-black text-primary dark:text-white">{currentTitle}</h1>
        </div>
        {showSearch ? (
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索案件号、企业名称或担保机构"
              className="w-80 rounded-full border border-slate-200 bg-surface-container-lowest py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary/15"
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container">
          <Bell className="h-5 w-5" />
        </button>
        <button className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container">
          <HelpCircle className="h-5 w-5" />
        </button>
        <button
          onClick={() => window.dispatchEvent(new Event(AI_ASSISTANT_TOGGLE_EVENT))}
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
          aria-label="打开 AI 助手"
        >
          <Bot className="h-5 w-5 text-tertiary-fixed-dim" />
        </button>
      </div>
    </header>
  );
}
