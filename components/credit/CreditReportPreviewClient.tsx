'use client';

import Link from 'next/link';
import { Download, FileText, LoaderCircle, Plus, RefreshCcw, Save, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import SubmitOaButton from '@/components/credit/SubmitOaButton';
import { parseCreditReportText } from '@/lib/credit-report-format';

type CreditTraceItem = {
  id: string;
  numberText: string;
  semanticLabel: string;
  sourceType: 'direct' | 'derived';
  sourceIds: string[];
  formula?: string;
  note?: string;
};

type GeneratedCreditReportWithTrace = {
  rawText: string;
  generatedAt: string;
  dataTrace: CreditTraceItem[];
};

type CreditPromptResource = {
  id: string;
  title: string;
  kind: 'template' | 'policy' | 'data' | 'structured';
  path?: string;
  purpose: string;
};

type CreditPromptConfig = {
  businessRequirements: string[];
  technicalRequirements: string[];
  templateConstraints: string[];
  resources: CreditPromptResource[];
};

function formatResourceKind(kind: CreditPromptResource['kind']) {
  if (kind === 'template') return '模板';
  if (kind === 'policy') return '制度';
  if (kind === 'data') return '资料';
  return '结构化数据';
}

type Props = {
  initialReport: GeneratedCreditReportWithTrace | null;
  autoGenerate: boolean;
  references: string[];
  oaMemo: string;
  promptConfig: CreditPromptConfig;
};

type StreamEvent =
  | { event: 'status'; data: { text?: string } }
  | { event: 'chunk'; data: { text?: string } }
  | { event: 'complete'; data: { text?: string; cached?: boolean; dataTrace?: CreditTraceItem[] } }
  | { event: 'error'; data: { message?: string } };

type ResolvedTraceSource = {
  title: string;
  fileName: string;
  field: string;
  method: string;
};

const CREDIT_STATISTICS_FILE = '副本2025年合作担保机构授信情况统计表.xlsx';
const CREDIT_POLICY_FILE = '陕西省信用再担保有限责任公司再担保业务授信管理办法.pdf';

function resolveTraceSource(sourceId: string): ResolvedTraceSource {
  const institutionFieldMap: Array<[string, string]> = [
    ['.scale2024', '2024年度备案规模（不含“总对总）'],
    ['.factor', '额度系数'],
    ['.growthRate', '再担保增长率'],
    ['.totalCredit', '2025年总授信额度 / 测算额度'],
    ['.soeCredit', '其中：国企额度'],
    ['.nonRiskCredit', '2025年非分险额度'],
    ['.riskCredit', '2025年分险额度'],
  ];
  const institutionField = institutionFieldMap.find(([suffix]) => sourceId.endsWith(suffix));

  if (sourceId === 'stats.institutionCount') {
    return {
      title: '合作机构数量',
      fileName: CREDIT_STATISTICS_FILE,
      field: '机构名称',
      method: '按统计表有效机构明细行计数',
    };
  }
  if (sourceId === 'stats.applicationTotal') {
    return {
      title: '申请授信总规模',
      fileName: '副本关于2025年度合作担保机构再担保业务授信的报告(1).docx',
      field: '样稿正文“申请授信规模”',
      method: '从历史授信报告样稿读取本年申请总额口径',
    };
  }
  if (sourceId === 'stats.grantedTotal') {
    return {
      title: '最终授予授信总额',
      fileName: CREDIT_STATISTICS_FILE,
      field: '2025年总授信额度 / 测算额度',
      method: '对统计表内合作机构明细逐行汇总',
    };
  }
  if (sourceId === 'stats.riskCreditTotal') {
    return {
      title: '银担分险业务额度',
      fileName: CREDIT_STATISTICS_FILE,
      field: '2025年分险额度',
      method: '对统计表内合作机构明细逐行汇总',
    };
  }
  if (sourceId === 'stats.nonRiskCreditTotal') {
    return {
      title: '非银担分险业务额度',
      fileName: CREDIT_STATISTICS_FILE,
      field: '2025年非分险额度',
      method: '对统计表内合作机构明细逐行汇总',
    };
  }
  if (sourceId === 'stats.soeCreditTotal') {
    return {
      title: '国有企业担保贷款额度',
      fileName: CREDIT_STATISTICS_FILE,
      field: '其中：国企额度',
      method: '对统计表内合作机构明细逐行汇总',
    };
  }
  if (sourceId.startsWith('groups.') && sourceId.endsWith('.count')) {
    return {
      title: '分组机构数量',
      fileName: CREDIT_STATISTICS_FILE,
      field: '机构名称 / 配置分组',
      method: '按授信配置分组统计机构数量',
    };
  }
  if (sourceId.startsWith('groups.') && sourceId.endsWith('.totalCredit')) {
    return {
      title: '分组授信额度合计',
      fileName: CREDIT_STATISTICS_FILE,
      field: '2025年总授信额度 / 测算额度',
      method: '按授信配置分组汇总机构授信额度',
    };
  }
  if (institutionField) {
    return {
      title: '机构明细字段',
      fileName: CREDIT_STATISTICS_FILE,
      field: institutionField[1],
      method: '读取统计表对应机构明细行',
    };
  }
  if (sourceId.startsWith('summary.executionNotes')) {
    return {
      title: '年度执行口径',
      fileName: CREDIT_POLICY_FILE,
      field: '授信管理办法及本年执行口径说明',
      method: '结合制度条文、历史样稿和统计表口径形成说明',
    };
  }

  return {
    title: '结构化数据字段',
    fileName: CREDIT_STATISTICS_FILE,
    field: sourceId,
    method: '由统计表解析后的结构化字段提供',
  };
}

function buildTraceCandidates(trace: CreditTraceItem) {
  const candidates = new Set<string>();
  const value = trace.numberText.trim();
  if (value) {
    candidates.add(value);
    candidates.add(value.replace(/\s+/g, ''));
    candidates.add(value.replace(/,/g, ''));
    candidates.add(value.replace(/\.00(?=[亿万元家倍%]|$)/g, ''));
  }
  return Array.from(candidates)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
}

function TracePopover({ trace, visible }: { trace: CreditTraceItem; visible: boolean }) {
  const sources = trace.sourceIds.map(resolveTraceSource);

  return (
    <span
      data-credit-trace-popover="true"
      className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-[380px] -translate-x-1/2 rounded-2xl border border-primary/15 bg-[#fffaf0] p-3.5 text-left text-[12px] font-normal leading-relaxed text-slate-700 shadow-[0_18px_45px_rgba(11,28,48,0.18)] ring-1 ring-white/80 ${
        visible ? 'block' : 'hidden'
      }`}
    >
      <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-primary/15 bg-[#fffaf0]" />
      <span className="relative block space-y-1.5">
        <span className="mb-1 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-black text-primary">
          {trace.semanticLabel}
        </span>
        <span className="block text-[12px] font-semibold text-slate-900">引用数值：{trace.numberText}</span>
        <span className="block text-slate-700">来源类型：{trace.sourceType === 'derived' ? '计算得出' : '直接引用'}</span>
        <span className="block rounded-lg bg-white/70 px-2 py-1 text-slate-700">
          {sources.map((source, index) => (
            <span key={`${trace.id}-${trace.sourceIds[index]}`} className="block border-b border-primary/10 py-1 last:border-b-0">
              <span className="block font-semibold text-slate-900">来源文件：{source.fileName}</span>
              <span className="block">字段/口径：{source.field}</span>
              <span className="block">取数方式：{source.method}</span>
            </span>
          ))}
        </span>
        {trace.formula ? <span className="block rounded-lg bg-primary/5 px-2 py-1 font-semibold text-primary">计算：{trace.formula}</span> : null}
        {trace.note ? <span className="block text-slate-700">说明：{trace.note}</span> : null}
      </span>
    </span>
  );
}

function TraceValue({ children, trace }: { children: React.ReactNode; trace: CreditTraceItem }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline cursor-pointer text-primary underline decoration-primary/50 decoration-dotted underline-offset-4"
      data-credit-trace="source"
      onBlur={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      tabIndex={0}
    >
      {children}
      <TracePopover trace={trace} visible={visible} />
    </span>
  );
}

function TraceText({ text, traces }: { text: string; traces: CreditTraceItem[] }) {
  if (traces.length === 0) return <>{text}</>;

  const matches = traces
    .flatMap((trace) =>
      buildTraceCandidates(trace)
        .map((candidate) => ({
          candidate,
          trace,
          index: text.indexOf(candidate),
        }))
        .filter((match) => match.index >= 0),
    )
    .sort((a, b) => a.index - b.index || b.candidate.length - a.candidate.length);

  const selected: Array<{ start: number; end: number; value: string; trace: CreditTraceItem }> = [];
  for (const match of matches) {
    const start = match.index;
    const end = start + match.candidate.length;
    if (selected.some((item) => start < item.end && end > item.start)) continue;
    selected.push({ start, end, value: match.candidate, trace: match.trace });
  }

  if (selected.length === 0) return <>{text}</>;

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  selected
    .sort((a, b) => a.start - b.start)
    .forEach((match, index) => {
      if (match.start > cursor) nodes.push(text.slice(cursor, match.start));
      nodes.push(
        <TraceValue key={`${match.trace.id}-${index}`} trace={match.trace}>
          {match.value}
        </TraceValue>,
      );
      cursor = match.end;
    });
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return <>{nodes}</>;
}

function parseSseFrames(buffer: string) {
  const frames = buffer.split('\n\n');
  return {
    frames: frames.slice(0, -1),
    rest: frames[frames.length - 1] ?? '',
  };
}

function parseSseEvent(frame: string): StreamEvent | null {
  const lines = frame.split('\n');
  let event = '';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (!event || dataLines.length === 0) return null;

  try {
    const data = JSON.parse(dataLines.join('\n')) as Record<string, unknown>;
    if (event === 'status') return { event, data: { text: typeof data.text === 'string' ? data.text : undefined } };
    if (event === 'chunk') return { event, data: { text: typeof data.text === 'string' ? data.text : undefined } };
    if (event === 'complete') {
      return {
        event,
        data: {
          text: typeof data.text === 'string' ? data.text : undefined,
          cached: typeof data.cached === 'boolean' ? data.cached : undefined,
          dataTrace: Array.isArray(data.dataTrace) ? (data.dataTrace as CreditTraceItem[]) : undefined,
        },
      };
    }
    if (event === 'error') return { event, data: { message: typeof data.message === 'string' ? data.message : undefined } };
    return null;
  } catch {
    return null;
  }
}

export default function CreditReportPreviewClient({ initialReport, autoGenerate, references, oaMemo, promptConfig }: Props) {
  const [report, setReport] = useState<GeneratedCreditReportWithTrace | null>(initialReport);
  const [displayText, setDisplayText] = useState(initialReport?.rawText ?? '');
  const [loading, setLoading] = useState(autoGenerate || !initialReport);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(autoGenerate || !initialReport ? 6 : 100);
  const [statusText, setStatusText] = useState(autoGenerate || !initialReport ? '正在准备流式生成授信报告...' : '授信报告已就绪');
  const [promptDraft, setPromptDraft] = useState<CreditPromptConfig>(promptConfig);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [expandedPromptKeys, setExpandedPromptKeys] = useState<Set<string>>(() => new Set());

  const pendingTextRef = useRef('');
  const fullTextRef = useRef(initialReport?.rawText ?? '');
  const streamDoneRef = useRef(false);
  const visibleTextRef = useRef(initialReport?.rawText ?? '');
  const previewSectionRef = useRef<HTMLDivElement | null>(null);
  const streamTailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPromptDraft(promptConfig);
  }, [promptConfig]);

  useEffect(() => {
    if (!loading) return;

    const timer = window.setInterval(() => {
      if (!pendingTextRef.current) {
        if (streamDoneRef.current) {
          setLoading(false);
          setProgress(100);
          setStatusText('授信报告生成完成');
          window.clearInterval(timer);
        }
        return;
      }

      const chunk = pendingTextRef.current.slice(0, 12);
      pendingTextRef.current = pendingTextRef.current.slice(chunk.length);
      setDisplayText((current) => {
        const next = current + chunk;
        visibleTextRef.current = next;
        return next;
      });
      setProgress((current) => Math.min(streamDoneRef.current ? 99 : 96, current + 1));
    }, 30);

    return () => window.clearInterval(timer);
  }, [loading]);

  const generate = useCallback(async (force: boolean) => {
    setLoading(true);
    setError(null);
    setReport(null);
    setDisplayText('');
    setProgress(6);
    setStatusText('正在准备流式生成授信报告...');
    pendingTextRef.current = '';
    fullTextRef.current = '';
    streamDoneRef.current = false;
    visibleTextRef.current = '';
    window.requestAnimationFrame(() => {
      previewSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });

    const response = await fetch('/api/credit-report/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force }),
    });

    if (!response.ok || !response.body) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? '授信报告生成失败');
      setLoading(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSseFrames(buffer);
        buffer = parsed.rest;

        for (const frame of parsed.frames) {
          const event = parseSseEvent(frame);
          if (!event) continue;

          if (event.event === 'status') {
            setStatusText(event.data.text ?? '正在生成授信报告...');
            setProgress((current) => Math.max(current, 12));
            continue;
          }

          if (event.event === 'chunk') {
            const text = event.data.text ?? '';
            if (!text) continue;
            fullTextRef.current += text;
            pendingTextRef.current += text;
            setStatusText('正在逐段生成授信报告正文...');
            setProgress((current) => Math.min(94, Math.max(current, 18)));
            continue;
          }

          if (event.event === 'complete') {
            const finalText = event.data.text ?? fullTextRef.current;
            fullTextRef.current = finalText;
            pendingTextRef.current = finalText.slice(visibleTextRef.current.length);
            setReport({
              rawText: finalText,
              generatedAt: new Date().toISOString(),
              dataTrace: event.data.dataTrace ?? [],
            });
            setStatusText(event.data.cached ? '已加载最新缓存授信报告' : '模型已完成生成，正在整理排版...');
            streamDoneRef.current = true;
            continue;
          }

          if (event.event === 'error') {
            throw new Error(event.data.message ?? '授信报告生成失败');
          }
        }
      }
    } catch (generationError) {
      setError((generationError as Error).message);
      setLoading(false);
      streamDoneRef.current = false;
    } finally {
      reader.releaseLock();
    }
  }, []);

  useEffect(() => {
    if (autoGenerate || !initialReport) {
      void generate(autoGenerate);
    }
  }, [autoGenerate, generate, initialReport]);

  const parsed = parseCreditReportText(displayText);
  const hasVisibleContent = Boolean(displayText.trim());
  const traceItems = report?.dataTrace ?? [];

  useEffect(() => {
    if (!loading || !hasVisibleContent) return;

    const frame = window.requestAnimationFrame(() => {
      streamTailRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [displayText, hasVisibleContent, loading]);

  const updateBusinessRequirement = (index: number, value: string) => {
    setPromptDraft((current) => ({
      ...current,
      businessRequirements: current.businessRequirements.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  };

  const addBusinessRequirement = () => {
    setPromptDraft((current) => ({
      ...current,
      businessRequirements: [...current.businessRequirements, ''],
    }));
  };

  const removeBusinessRequirement = (index: number) => {
    setPromptDraft((current) => ({
      ...current,
      businessRequirements: current.businessRequirements.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const persistPromptConfig = useCallback(async () => {
    const payload = {
      ...promptDraft,
      businessRequirements: promptDraft.businessRequirements.map((item) => item.trim()).filter(Boolean),
    };
    if (!payload.businessRequirements.length) {
      throw new Error('业务要求至少保留 1 条');
    }
    const response = await fetch('/api/credit-report/prompt-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.error ?? result?.message ?? '保存 AI 指令失败');
    }
    const result = (await response.json()) as { config: CreditPromptConfig };
    setPromptDraft(result.config);
    return result.config;
  }, [promptDraft]);

  const savePromptConfig = useCallback(async () => {
    setSavingPrompt(true);
    setPromptError(null);
    try {
      await persistPromptConfig();
    } catch (saveError) {
      setPromptError((saveError as Error).message);
    } finally {
      setSavingPrompt(false);
    }
  }, [persistPromptConfig]);

  const regenerateWithCurrentPrompt = useCallback(async () => {
    setSavingPrompt(true);
    setPromptError(null);
    try {
      await persistPromptConfig();
    } catch (saveError) {
      setPromptError((saveError as Error).message);
      setSavingPrompt(false);
      return;
    }
    setSavingPrompt(false);
    await generate(true);
  }, [generate, persistPromptConfig]);

  const resetPromptConfig = useCallback(async () => {
    setSavingPrompt(true);
    setPromptError(null);
    try {
      const response = await fetch('/api/credit-report/prompt-config', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('恢复默认指令失败');
      }
      const result = (await response.json()) as { config: CreditPromptConfig };
      setPromptDraft(result.config);
    } catch (resetError) {
      setPromptError((resetError as Error).message);
    } finally {
      setSavingPrompt(false);
    }
  }, []);

  const togglePromptLine = (key: string) => {
    setExpandedPromptKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const resourceGroups = {
    template: promptDraft.resources.filter((item) => item.kind === 'template'),
    policy: promptDraft.resources.filter((item) => item.kind === 'policy'),
    data: promptDraft.resources.filter((item) => item.kind === 'data'),
    structured: promptDraft.resources.filter((item) => item.kind === 'structured'),
  };
  const referenceResources = [...resourceGroups.policy, ...resourceGroups.data, ...resourceGroups.structured];

  return (
    <>
      <section className="col-span-12 xl:col-span-8">
        <div ref={previewSectionRef} className="overflow-hidden rounded-3xl border border-outline-variant/10 bg-white shadow-[0_20px_40px_rgba(11,28,48,0.06)]">
          <div className="border-b border-outline-variant/5 bg-surface-container-low px-8 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">授信报告预览</p>
          </div>

          <div className="bg-white p-8 md:p-12">
            {!hasVisibleContent && loading ? (
              <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center rounded-[2rem] border border-dashed border-outline-variant/30 bg-surface-container-low px-8 py-10 text-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-secondary" />
                <p className="mt-5 text-lg font-black text-primary">正在生成授信报告</p>
                <p className="mt-2 text-sm text-on-surface-variant">{statusText}</p>
                <div className="mt-6 h-2 w-full max-w-md overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-3 text-xs font-bold text-secondary">{progress}%</p>
                {error ? (
                  <div className="mt-6 max-w-xl rounded-2xl border border-error/20 bg-error-container/30 px-4 py-4 text-left">
                    <p className="text-sm font-black text-error">生成失败</p>
                    <p className="mt-2 text-sm leading-6 text-on-error-container">{error}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <article className="mx-auto min-h-[60vh] max-w-3xl rounded-[1.75rem] border border-outline-variant/15 bg-white px-8 py-10 font-['Songti_SC','STSong','SimSun',serif] text-[15px] leading-[2] text-on-surface shadow-[0_12px_30px_rgba(11,28,48,0.05)] md:px-12 md:py-14">
                <div className="mb-6 border-b border-outline-variant/10 pb-4">
                  <p className="text-xs font-black tracking-[0.16em] text-on-surface-variant">{statusText}</p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-low">
                    <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {parsed.title ? <h2 className="mb-10 text-center text-[2rem] font-bold leading-relaxed text-primary">{parsed.title}</h2> : null}
                {parsed.addressee ? <p className="mb-4">{parsed.addressee}</p> : null}

                {parsed.blocks.map((block, index) => {
                  if (block.kind === 'section') {
                    return (
                      <p key={`${block.kind}-${index}`} className="mb-3 mt-4 text-base font-bold text-primary">
                        <TraceText text={block.text} traces={traceItems} />
                      </p>
                    );
                  }

                  return (
                    <p key={`${block.kind}-${index}`} className="mb-2 indent-8">
                      <TraceText text={block.text} traces={traceItems} />
                    </p>
                  );
                })}

                {parsed.attachmentLine ? (
                  <p className="mt-6">
                    <TraceText text={parsed.attachmentLine} traces={traceItems} />
                  </p>
                ) : null}
                {parsed.signatureDepartment || parsed.signatureDate ? (
                  <div className="mt-12 text-right">
                    {parsed.signatureDepartment ? <p>{parsed.signatureDepartment}</p> : null}
                    {parsed.signatureDate ? <p>{parsed.signatureDate}</p> : null}
                  </div>
                ) : null}

                {loading ? (
                  <p className="mt-6 text-xs font-black tracking-[0.14em] text-secondary">内容仍在持续生成中...</p>
                ) : null}
                <div ref={streamTailRef} />
              </article>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void generate(true)}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl border border-outline-variant/30 bg-white px-5 py-3 text-sm font-black text-primary disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            重新生成
          </button>
          <Link href="/api/credit-report/export-report" className="flex items-center gap-2 rounded-2xl border border-outline-variant/30 bg-white px-5 py-3 text-sm font-black text-primary">
            <Download className="h-4 w-4" />
            导出 Word
          </Link>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-error/20 bg-error-container/30 px-4 py-4">
            <p className="text-sm font-black text-error">生成失败</p>
            <p className="mt-2 text-sm leading-6 text-on-error-container">{error}</p>
          </div>
        ) : null}
      </section>

      <aside className="col-span-12 space-y-4 xl:col-span-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-surface-container-low text-secondary">
              <FileText className="h-4 w-4" />
            </span>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">AI 指令</p>
          </div>
          <div className="space-y-2">
            {promptDraft.businessRequirements.map((item, index) => (
              <div
                key={`business-${index}`}
                role="button"
                tabIndex={0}
                onClick={() => togglePromptLine(`business-${index}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') togglePromptLine(`business-${index}`);
                }}
                className="flex items-start gap-2 rounded-2xl border border-outline-variant/15 bg-surface-container-low px-3 py-2"
              >
                <span className="mt-0.5 shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-secondary">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {expandedPromptKeys.has(`business-${index}`) ? (
                  <textarea
                    rows={3}
                    value={item}
                    onChange={(event) => updateBusinessRequirement(index, event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                    className="min-h-0 flex-1 resize-y rounded-xl border border-outline-variant/15 bg-white px-3 py-2 text-sm font-semibold leading-6 text-on-surface outline-none"
                  />
                ) : (
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold leading-6 text-on-surface">{item}</p>
                )}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeBusinessRequirement(index);
                    }}
                    className="shrink-0 rounded-full p-1 text-on-surface-variant transition hover:bg-white hover:text-error"
                    aria-label="删除业务要求"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
              </div>
            ))}

            {promptDraft.templateConstraints.map((item, index) => (
              <div
                key={`template-${index}`}
                role="button"
                tabIndex={0}
                onClick={() => togglePromptLine(`format-${index}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') togglePromptLine(`format-${index}`);
                }}
                className="flex items-start gap-2 rounded-2xl border border-secondary/15 bg-secondary-container/30 px-3 py-2 text-sm font-semibold leading-6 text-on-surface"
              >
                <span className="mt-0.5 shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-black text-secondary">
                  格{String(index + 1).padStart(2, '0')}
                </span>
                <p className={expandedPromptKeys.has(`format-${index}`) ? '' : 'truncate'}>{item}</p>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={addBusinessRequirement}
                className="flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-white px-3 py-2 text-xs font-black text-primary"
              >
                <Plus className="h-4 w-4" />
                新增
              </button>
              <button
                type="button"
                onClick={() => void savePromptConfig()}
                disabled={savingPrompt}
                className="flex items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-xs font-black text-white disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                保存
              </button>
              <button
                type="button"
                onClick={() => void regenerateWithCurrentPrompt()}
                disabled={savingPrompt || loading}
                className="flex items-center gap-2 rounded-2xl border border-outline-variant/20 bg-white px-3 py-2 text-xs font-black text-primary disabled:opacity-60"
              >
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                重新生成
              </button>
              <button
                type="button"
                onClick={() => void resetPromptConfig()}
                disabled={savingPrompt}
                className="rounded-2xl border border-outline-variant/20 bg-white px-3 py-2 text-xs font-black text-primary disabled:opacity-60"
              >
                恢复默认
              </button>
            </div>

            {promptError ? (
              <div className="rounded-2xl border border-error/20 bg-error-container/30 px-4 py-3 text-sm leading-6 text-on-error-container">
                {promptError}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-surface-container-low text-secondary">
              <FileText className="h-4 w-4" />
            </span>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">参考模板</p>
          </div>
          <div className="space-y-2">
            {resourceGroups.template.map((item) => (
              <div key={item.id} className="rounded-2xl bg-surface-container-low px-3 py-2">
                <p className="text-sm font-black text-primary">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-on-surface-variant">{item.purpose}</p>
                {item.path ? <p className="mt-1 break-all text-[11px] leading-5 text-on-surface-variant">{item.path}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-surface-container-low text-secondary">
              <FileText className="h-4 w-4" />
            </span>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">参考资料</p>
          </div>
          <div className="space-y-2">
            {referenceResources.map((item) => (
              <div key={item.id} className="rounded-2xl bg-surface-container-low px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-primary">{item.title}</p>
                  <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black tracking-[0.12em] text-secondary">{formatResourceKind(item.kind)}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-on-surface-variant">{item.purpose}</p>
                {item.path ? <p className="mt-1 break-all text-[11px] leading-5 text-on-surface-variant">{item.path}</p> : null}
              </div>
            ))}
            {references.map((item) => (
              <div key={item} className="rounded-2xl bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface">
                {item}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="fixed bottom-8 right-10 z-30 flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-[0_20px_42px_rgba(11,28,48,0.14)]">
        <div className="text-right">
          <p className="text-xs font-black text-primary">下一步审批人</p>
          <p className="text-[11px] text-on-surface-variant">业务A角、业务B角、部门负责人</p>
        </div>
        <SubmitOaButton defaultMemo={oaMemo} />
      </div>
    </>
  );
}
