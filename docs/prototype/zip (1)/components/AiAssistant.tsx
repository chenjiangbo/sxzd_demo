'use client';

import { MessageSquare, AlertTriangle, ListChecks, History, ChevronLeft, Bolt, X, Lightbulb, Scan } from 'lucide-react';
import { useState } from 'react';

export default function AiAssistant() {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isExpanded) {
    return (
      <div className="fixed right-0 top-0 h-full z-50 flex flex-col items-center py-6 w-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-l border-outline-variant/20 shadow-[-20px_0_40px_rgba(11,28,48,0.06)]">
        <div className="w-10 h-10 bg-tertiary-fixed-dim/10 text-tertiary-container rounded-lg flex items-center justify-center mb-10">
          <Bolt className="w-6 h-6 fill-tertiary-container/20" />
        </div>
        
        <div className="flex flex-col gap-8">
          <button className="text-slate-400 hover:text-secondary group flex flex-col items-center gap-1 transition-colors">
            <MessageSquare className="w-5 h-5" />
            <span className="text-[8px] font-bold">问答</span>
          </button>
          
          <button className="text-secondary group flex flex-col items-center gap-1 relative transition-colors">
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full"></div>
            <AlertTriangle className="w-5 h-5 fill-secondary/20" />
            <span className="text-[8px] font-bold">预警</span>
          </button>
          
          <button className="text-slate-400 hover:text-secondary group flex flex-col items-center gap-1 transition-colors">
            <ListChecks className="w-5 h-5" />
            <span className="text-[8px] font-bold">合规</span>
          </button>
          
          <button className="text-slate-400 hover:text-secondary group flex flex-col items-center gap-1 transition-colors">
            <History className="w-5 h-5" />
            <span className="text-[8px] font-bold">历史</span>
          </button>
        </div>
        
        <div className="mt-auto">
          <button 
            onClick={() => setIsExpanded(true)}
            className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="fixed right-0 top-0 h-full w-80 z-50 flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-[-20px_0_40px_rgba(11,28,48,0.06)] font-body">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#001b18] dark:text-tertiary-fixed-dim">AI 智能助手</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Agent Intelligence</p>
        </div>
        <button onClick={() => setIsExpanded(false)} className="hover:bg-slate-100 p-1 rounded-full transition-colors">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex p-2 bg-surface-container-low m-4 rounded-xl">
          <button className="flex-1 flex flex-col items-center py-2 bg-tertiary-fixed-dim/10 text-[#001b18] dark:text-tertiary-fixed-dim rounded-lg">
            <Bolt className="w-4 h-4 fill-current mb-1" />
            <span className="text-[10px]">智能问答</span>
          </button>
          <button className="flex-1 flex flex-col items-center py-2 text-slate-400 hover:text-slate-600 transition-all">
            <AlertTriangle className="w-4 h-4 mb-1" />
            <span className="text-[10px]">风险预警</span>
          </button>
          <button className="flex-1 flex flex-col items-center py-2 text-slate-400 hover:text-slate-600 transition-all">
            <ListChecks className="w-4 h-4 mb-1" />
            <span className="text-[10px]">合规建议</span>
          </button>
          <button className="flex-1 flex flex-col items-center py-2 text-slate-400 hover:text-slate-600 transition-all">
            <History className="w-4 h-4 mb-1" />
            <span className="text-[10px]">历史追踪</span>
          </button>
        </div>
        
        <div className="flex-1 px-6 space-y-6 overflow-y-auto pb-6">
          <div className="p-4 bg-primary text-white rounded-xl shadow-sm">
            <p className="text-xs leading-relaxed">
              你好，我是补偿审核助手。当前案件 <span className="text-tertiary-fixed-dim font-bold">CAS-20251021-001</span> 已完成自动解析，你可以问我关于材料完整性或债务人风险的问题。
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-on-surface-variant uppercase">常见问题</h4>
            <button className="w-full text-left p-3 text-xs bg-surface-container-lowest border border-slate-100 rounded-lg hover:border-secondary transition-all">
              该案件是否有重复补偿记录？
            </button>
            <button className="w-full text-left p-3 text-xs bg-surface-container-lowest border border-slate-100 rounded-lg hover:border-secondary transition-all">
              借款合同中的担保条款是否完整？
            </button>
            <button className="w-full text-left p-3 text-xs bg-surface-container-lowest border border-slate-100 rounded-lg hover:border-secondary transition-all">
              分析该债务人的行业风险趋势。
            </button>
          </div>
          
          <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-surface-container-lowest">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-primary">合规提示</span>
            </div>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              检测到“代偿补偿函”签章模糊，建议在完整性检查阶段进行人工标记或重新上传清晰件。
            </p>
          </div>
        </div>
        
        <div className="p-6 mt-auto bg-slate-50 border-t border-slate-100">
          <button className="w-full bg-[#001b18] text-tertiary-fixed-dim py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all">
            <Scan className="w-4 h-4" />
            开始风险扫描
          </button>
        </div>
      </div>
    </aside>
  );
}
