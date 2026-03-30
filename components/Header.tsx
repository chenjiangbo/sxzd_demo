'use client';

import { Bell, Bot, HelpCircle, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { AI_ASSISTANT_TOGGLE_EVENT } from '@/lib/ai-assistant-events';

const titleMap: Record<string, string> = {
  '/': '代偿补偿',
  '/cases/workbench': '案件处理工作台',
};

export default function Header() {
  const pathname = usePathname();
  const currentTitle = titleMap[pathname] ?? '代偿补偿';
  const showSearch = pathname === '/';

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
