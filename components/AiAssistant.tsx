'use client';

import {
  AlertTriangle,
  Bolt,
  History,
  Lightbulb,
  ListChecks,
  MessageSquare,
  Scan,
  X,
} from 'lucide-react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AI_ASSISTANT_CLOSE_EVENT, AI_ASSISTANT_OPEN_EVENT, AI_ASSISTANT_TOGGLE_EVENT } from '@/lib/ai-assistant-events';

const stepPrompts: Record<string, { intro: string; suggestions: string[]; tip: string }> = {
  overview: {
    intro: '当前是案件总览阶段，我已经加载这笔案件的业务链路、材料归集结果和 AI 初检摘要。',
    suggestions: [
      '这笔案件的链路里有哪些关键节点？',
      '帮我用一句话总结这笔案子的业务状态。',
      '当前总览里最值得先看的材料分组是哪一个？',
    ],
    tip: '建议先从台账链路和材料归集讲起，再进入材料清单检查。',
  },
  integrity: {
    intro: '当前是材料完整性检查阶段，我会优先解释哪些材料缺失、哪些待确认、哪些可能并件。',
    suggestions: [
      '为什么这个材料被判为缺失？',
      '哪个材料项最需要人工先确认？',
      '帮我定位代偿证明相关文件。',
    ],
    tip: '这个步骤适合强调系统已经把材料归类、匹配和缺口提示做完。',
  },
  verify: {
    intro: '当前是一致性与规则阶段，我已经加载字段交叉比对、规则命中和金额测算结果。',
    suggestions: [
      '为什么补偿金额这样算？',
      '当前哪些规则还需要人工确认？',
      '哪条规则最影响后面的文书生成？',
    ],
    tip: '这个步骤最适合讲“确定性规则由程序完成，解释由 AI 完成”。',
  },
  evidence: {
    intro: '当前是证据查看阶段，我会结合当前字段结论和原始文件位置来解释 AI 判断依据。',
    suggestions: [
      '这个结论引用了哪些材料？',
      '帮我定位统一社会信用代码所在原文。',
      '这个风险对应的原始依据在哪个文件？',
    ],
    tip: '本步骤适合重点演示“可解释、可追溯、可定位”。',
  },
  document: {
    intro: '当前是文书生成阶段，我已经读取三份草稿的自动填充字段和风险提示。',
    suggestions: [
      '这段审批结论引用了哪些材料？',
      '帮我重写这段追偿方案。',
      '这份文书里有哪些待人工确认项？',
    ],
    tip: '建议突出文书是基于前面步骤自动落成，而不是独立手工编写。',
  },
  review: {
    intro: '当前是复核与提交阶段，我会优先帮助你收敛风险项、整理审批口径并准备 OA 发起说明。',
    suggestions: [
      '提交 OA 前还有哪些风险项？',
      '帮我总结给部门负责人的一句话说明。',
      '只看会影响审批结论的事项。',
    ],
    tip: '演示结尾时建议强调“人来拍板，AI 负责辅助解释和整理流程”。',
  },
  list: {
    intro: '当前是案件池列表页，我可以帮助你快速找到目标案件或解释当前队列状态。',
    suggestions: [
      '这笔案件为什么会进入待人工复核？',
      '帮我概括一下这笔案件当前最重要的风险点。',
      '从案件池进入后第一步应该看什么？',
    ],
    tip: '建议先进入宝鸡三家村案件工作台，形成完整流程演示。',
  },
};

function AiAssistantInner() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const onToggle = () => setIsOpen((value) => !value);
    const onOpen = () => setIsOpen(true);
    const onClose = () => setIsOpen(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener(AI_ASSISTANT_TOGGLE_EVENT, onToggle);
    window.addEventListener(AI_ASSISTANT_OPEN_EVENT, onOpen);
    window.addEventListener(AI_ASSISTANT_CLOSE_EVENT, onClose);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener(AI_ASSISTANT_TOGGLE_EVENT, onToggle);
      window.removeEventListener(AI_ASSISTANT_OPEN_EVENT, onOpen);
      window.removeEventListener(AI_ASSISTANT_CLOSE_EVENT, onClose);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const context = useMemo(() => {
    if (pathname === '/') {
      return stepPrompts.list;
    }

    if (pathname === '/cases/workbench') {
      const step = searchParams.get('step') ?? 'overview';
      return stepPrompts[step] ?? stepPrompts.overview;
    }

    return stepPrompts.overview;
  }, [pathname, searchParams]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="关闭 AI 助手"
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
      />

      <aside className="absolute right-0 top-0 flex h-full w-[22rem] max-w-[92vw] flex-col bg-white font-body shadow-[-20px_0_40px_rgba(11,28,48,0.12)]">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h3 className="text-lg font-bold text-primary">AI 助手</h3>
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Current Case + Current Step</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="rounded-full p-1 transition-colors hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="m-4 flex rounded-xl bg-surface-container-low p-2">
          <button className="flex flex-1 flex-col items-center rounded-lg bg-tertiary-fixed-dim/10 py-2 text-primary">
            <Bolt className="mb-1 h-4 w-4 fill-current" />
            <span className="text-[10px]">智能问答</span>
          </button>
          <button className="flex flex-1 flex-col items-center py-2 text-slate-400 transition-all hover:text-slate-600">
            <AlertTriangle className="mb-1 h-4 w-4" />
            <span className="text-[10px]">风险预警</span>
          </button>
          <button className="flex flex-1 flex-col items-center py-2 text-slate-400 transition-all hover:text-slate-600">
            <ListChecks className="mb-1 h-4 w-4" />
            <span className="text-[10px]">合规建议</span>
          </button>
          <button className="flex flex-1 flex-col items-center py-2 text-slate-400 transition-all hover:text-slate-600">
            <History className="mb-1 h-4 w-4" />
            <span className="text-[10px]">历史追踪</span>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
          <div className="rounded-xl bg-primary p-4 text-white shadow-sm">
            <p className="text-xs leading-relaxed">{context.intro}</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase text-on-surface-variant">推荐问题</h4>
            {context.suggestions.map((item) => (
              <button
                key={item}
                className="w-full rounded-lg border border-slate-100 bg-surface-container-lowest p-3 text-left text-xs transition-all hover:border-secondary"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-dashed border-slate-200 bg-surface-container-lowest p-4">
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold text-primary">当前步骤提示</span>
            </div>
            <p className="text-[10px] leading-relaxed text-on-surface-variant">{context.tip}</p>
          </div>
        </div>

        <div className="mt-auto border-t border-slate-100 bg-slate-50 p-6">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-white transition-all hover:bg-primary/90">
            <Scan className="h-4 w-4" />
            读取当前步骤上下文
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function AiAssistant() {
  return (
    <Suspense fallback={null}>
      <AiAssistantInner />
    </Suspense>
  );
}
