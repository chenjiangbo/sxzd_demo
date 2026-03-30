import { Search, Bell, HelpCircle, Bot } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 right-0 left-64 h-16 flex items-center justify-between px-8 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800/50">
      <div className="flex items-center gap-8">
        <span className="text-xl font-black text-primary dark:text-white font-headline">补贴案件审核中心</span>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-slate-500 dark:text-slate-400 hover:text-primary transition-all text-sm font-semibold">案件总览</Link>
          <Link href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary transition-all text-sm font-semibold">完整性检查</Link>
          <Link href="/verify" className="text-secondary dark:text-blue-400 border-b-2 border-secondary pb-2 font-bold transition-all text-sm">核验与规则</Link>
          <Link href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary transition-all text-sm font-semibold">证据查看</Link>
          <Link href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary transition-all text-sm font-semibold">文书生成</Link>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="搜索案件号或企业..." 
            className="pl-10 pr-4 py-1.5 bg-surface-container-low border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-secondary/20 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
            <Bot className="w-5 h-5 text-tertiary-fixed-dim" />
          </button>
        </div>
      </div>
    </header>
  );
}
