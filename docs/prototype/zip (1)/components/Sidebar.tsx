import { ClipboardList, LayoutDashboard, ListChecks, Settings, History, User } from 'lucide-react';
import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full z-40 bg-slate-50 dark:bg-slate-900 w-64 flex flex-col border-r-0 font-headline text-sm font-semibold tracking-tight">
      <div className="p-6 flex flex-col gap-1">
        <span className="text-lg font-extrabold text-[#002B5B] dark:text-white">代偿补贴系统</span>
        <span className="text-xs text-slate-400 font-medium">V2.4.0</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 text-[#002B5B] dark:text-blue-300 font-bold border-r-4 border-[#002B5B] bg-white dark:bg-slate-800 transition-colors duration-200 shadow-sm rounded-l-lg">
          <ClipboardList className="w-5 h-5" />
          <span>案件管理</span>
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-[#002B5B] hover:bg-surface-container-low dark:hover:bg-slate-800/80 transition-colors duration-200 rounded-lg">
          <LayoutDashboard className="w-5 h-5" />
          <span>数据看板</span>
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-[#002B5B] hover:bg-surface-container-low dark:hover:bg-slate-800/80 transition-colors duration-200 rounded-lg">
          <ListChecks className="w-5 h-5" />
          <span>规则配置</span>
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-[#002B5B] hover:bg-surface-container-low dark:hover:bg-slate-800/80 transition-colors duration-200 rounded-lg">
          <Settings className="w-5 h-5" />
          <span>系统设置</span>
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-[#002B5B] hover:bg-surface-container-low dark:hover:bg-slate-800/80 transition-colors duration-200 rounded-lg">
          <History className="w-5 h-5" />
          <span>操作审计</span>
        </Link>
      </nav>

      <div className="p-6 flex items-center gap-3 bg-surface-container-low dark:bg-slate-800/50 m-4 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white overflow-hidden">
          <User className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-primary">Admin User</span>
          <span className="text-[10px] text-slate-400">管理员权限</span>
        </div>
      </div>
    </aside>
  );
}
