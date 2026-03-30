'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  href: string;
  label: string;
  stepKey: string;
  icon?: ReactNode;
  className?: string;
};

const STEP_TRANSITIONS: Record<
  string,
  {
    title: string;
    subtitle: string;
    tasks: string[];
    totalMs?: number;
    tickMs?: number;
  }
> = {
  overview: {
    title: '正在生成案件总览',
    subtitle: '系统正在读取案件缓存、整理台账与材料结果，并生成本次审查的总览页面。',
    tasks: ['读取案件基础缓存', '整理台账与材料索引', '生成案件总览结论', '准备后续步骤可复用数据'],
  },
  integrity: {
    title: '正在分析材料完整性',
    subtitle: '系统正在根据案件缓存梳理材料清单、匹配文件并生成本步检查结论。',
    tasks: ['读取案件缓存结果', '匹配核心材料清单', '生成材料完整性结论'],
  },
  verify: {
    title: '正在分析一致性与规则',
    subtitle: '系统正在核对关键字段、计算金额口径并生成规则校验结论。',
    tasks: ['读取字段与材料索引', '核对合同号与金额口径', '生成规则校验结论'],
  },
  document: {
    title: '正在生成审查报告',
    subtitle: '系统正在基于案件缓存、规则结果和已生成草稿整理三份报告内容。',
    tasks: ['读取案件审查结论与规则结果', '生成《合规性自查工作底稿》', '生成《再担保代偿补偿审批表》', '整理报告复核提示并准备预览'],
    totalMs: 9200,
    tickMs: 1800,
  },
  review: {
    title: '正在生成复核建议',
    subtitle: '系统正在汇总风险、差异对比与 OA 提交建议。',
    tasks: ['读取风险与待确认事项', '整理 OA 提交流程数据', '生成复核提交建议'],
  },
};

export default function StepTransitionButton({ href, label, stepKey, icon, className }: Props) {
  const [open, setOpen] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);

  const config = useMemo(
    () =>
      STEP_TRANSITIONS[stepKey] ?? {
        title: '正在准备下一步',
        subtitle: '系统正在整理当前步骤所需数据并生成结果。',
        tasks: ['读取案件缓存', '整理本步数据', '生成步骤结论'],
        totalMs: 5200,
        tickMs: 1000,
      },
    [stepKey],
  );

  useEffect(() => {
    if (!open) return;

    const tickMs = config.tickMs ?? 1000;
    const totalMs = config.totalMs ?? 5200;

    const interval = window.setInterval(() => {
      setProgressIndex((current) => {
        if (current >= config.tasks.length - 1) {
          window.clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, tickMs);

    const timer = window.setTimeout(() => {
      window.location.href = href;
    }, totalMs);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [config.tasks.length, config.tickMs, config.totalMs, href, open]);

  const overlay = open ? (
    <>
      <div className="fixed inset-0 z-[150] bg-slate-950/35" />
      <div className="fixed left-1/2 top-1/2 z-[151] w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
            <LoaderCircle className="h-7 w-7 animate-spin" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-secondary">STEP ANALYSIS</p>
            <h3 className="mt-2 text-2xl font-black text-primary">{config.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{config.subtitle}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {config.tasks.map((task, index) => {
            const done = index <= progressIndex;
            return (
              <div
                key={task}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                  done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-surface-container-low'
                }`}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                    done ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : <span className="text-[11px] font-black">{String(index + 1).padStart(2, '0')}</span>}
                </span>
                <span className={`text-sm font-semibold ${done ? 'text-emerald-700' : 'text-primary'}`}>{task}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setProgressIndex(0);
          setOpen(true);
        }}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-lg shadow-primary/15 transition-colors hover:bg-primary/90',
          className,
        )}
      >
        {icon}
        {label}
      </button>
      {typeof document !== 'undefined' && overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}
