'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Download, FileText, RefreshCcw } from 'lucide-react';
import type { CaseAnalysis } from '@/lib/server/case-analysis';
import {
  REVEAL_ORDER,
  type ApprovalBorrowRow,
  type ApprovalRiskRow,
  type GeneratedCompensationReport,
} from '@/lib/compensation-report-format';

type Props = {
  analysis: CaseAnalysis;
  initialReport: GeneratedCompensationReport | null;
};

type StreamEvent =
  | { event: 'status'; data: { text?: string } }
  | { event: 'chunk'; data: { report?: GeneratedCompensationReport; revealCount?: number; cached?: boolean } }
  | { event: 'complete'; data: { report?: GeneratedCompensationReport; cached?: boolean } }
  | { event: 'error'; data: { message?: string } };

type RevealKey = (typeof REVEAL_ORDER)[number];
type ReportSections = GeneratedCompensationReport['structured']['sections'];
type ParagraphSectionKey = Exclude<keyof ReportSections, 'borrowRows' | 'riskRows'>;
type PlaybackStep =
  | { type: 'header' }
  | { type: 'paragraph'; section: ParagraphSectionKey; index: number; text: string }
  | { type: 'borrowRow'; row: ApprovalBorrowRow }
  | { type: 'riskRow'; row: ApprovalRiskRow };

const PARAGRAPH_SECTION_ORDER: ParagraphSectionKey[] = [
  'debtorProfile',
  'counterGuarantee',
  'filingInfo',
  'compensationReason',
  'riskExplanation',
  'recoveryPlan',
  'conclusion',
];
const TEXT_CHUNK_SIZE = 6;
const PLAYBACK_INTERVAL_MS = 110;

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
    if (event === 'chunk') {
      return {
        event,
        data: {
          report: typeof data.report === 'object' && data.report ? (data.report as GeneratedCompensationReport) : undefined,
          revealCount: typeof data.revealCount === 'number' ? data.revealCount : undefined,
          cached: typeof data.cached === 'boolean' ? data.cached : undefined,
        },
      };
    }
    if (event === 'complete') {
      return {
        event,
        data: {
          report: typeof data.report === 'object' && data.report ? (data.report as GeneratedCompensationReport) : undefined,
          cached: typeof data.cached === 'boolean' ? data.cached : undefined,
        },
      };
    }
    if (event === 'error') return { event, data: { message: typeof data.message === 'string' ? data.message : undefined } };
    return null;
  } catch {
    return null;
  }
}

function buildKeyFacts(analysis: CaseAnalysis) {
  return [
    `债务人：${analysis.summary.company}`,
    `债权人：${analysis.summary.bank}`,
    `主债权金额：${analysis.summary.amount}`,
    `未清偿本金：${analysis.keyFacts.uncompensatedPrincipal} 元`,
    `建议补偿金额：${analysis.summary.compensationAmount}`,
    `责任比例：${analysis.keyFacts.reGuaranteeRatio}`,
  ];
}

function buildEmptyReportSkeleton(target: GeneratedCompensationReport): GeneratedCompensationReport {
  return {
    ...target,
    rawText: '',
    structured: {
      header: {
        guarantorName: '',
        date: '',
        title: '',
      },
      sections: {
        debtorProfile: [],
        borrowRows: [],
        counterGuarantee: [],
        filingInfo: [],
        compensationReason: [],
        riskRows: [],
        riskExplanation: [],
        recoveryPlan: [],
        conclusion: [],
      },
    },
  };
}

function buildPlaybackQueue(report: GeneratedCompensationReport): PlaybackStep[] {
  const steps: PlaybackStep[] = [{ type: 'header' }];
  for (const text of report.structured.sections.debtorProfile) {
    steps.push({ type: 'paragraph', section: 'debtorProfile', index: steps.filter((s) => s.type === 'paragraph' && s.section === 'debtorProfile').length, text });
  }
  for (const row of report.structured.sections.borrowRows) {
    steps.push({ type: 'borrowRow', row });
  }
  for (const section of ['counterGuarantee', 'filingInfo', 'compensationReason', 'riskExplanation', 'recoveryPlan', 'conclusion'] as const) {
    for (const text of report.structured.sections[section]) {
      steps.push({
        type: 'paragraph',
        section,
        index: steps.filter((s) => s.type === 'paragraph' && s.section === section).length,
        text,
      });
    }
    if (section === 'compensationReason') {
      for (const row of report.structured.sections.riskRows) {
        steps.push({ type: 'riskRow', row });
      }
    }
  }
  return steps;
}

function revealIndexForSection(section: RevealKey | ParagraphSectionKey) {
  const normalized = section === 'riskExplanation' ? 'riskRows' : section;
  return REVEAL_ORDER.indexOf(normalized as RevealKey) + 1;
}

function nextParagraphArray(existing: string[], paragraphIndex: number, nextText: string) {
  const copy = existing.slice();
  while (copy.length < paragraphIndex) {
    copy.push('');
  }
  copy[paragraphIndex] = nextText;
  return copy;
}

function ApprovalSectionTitle({ children }: { children: string }) {
  return <h3 className="text-[20px] font-black text-primary">{children}</h3>;
}

function ReportTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300">
      <table className="w-full border-collapse text-[15px] leading-7">
        <thead className="bg-slate-100">
          <tr>
            {headers.map((header) => (
              <th key={header} className="border border-slate-300 px-3 py-3 text-left font-black text-primary">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${row.join('-')}`} className="align-top">
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="border border-slate-300 px-3 py-3 text-on-surface">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VerticalSectionLabel({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div
      className={`flex h-full items-center justify-center px-2 py-6 font-black tracking-[0.14em] text-primary ${compact ? 'text-[24px]' : 'text-[28px]'}`}
      style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
    >
      {label}
    </div>
  );
}

function ApprovalPreview({
  report,
  revealCount,
  scrollAnchorRef,
}: {
  report: GeneratedCompensationReport;
  revealCount: number;
  scrollAnchorRef: RefObject<HTMLDivElement | null>;
}) {
  const visible = new Set<RevealKey>(REVEAL_ORDER.slice(0, revealCount));
  const { header, sections } = report.structured;
  return (
    <article className="mx-auto min-h-[72vh] max-w-[1180px] rounded-[1.25rem] bg-white px-10 py-12 font-['Songti_SC','STSong','SimSun',serif] text-[17px] leading-[2] text-on-surface shadow-[0_12px_30px_rgba(11,28,48,0.05)] md:px-14 md:py-16">
      {visible.has('header') ? (
        <>
          <div className="mb-10 text-center">
            <h2 className="text-[2.8rem] font-bold leading-[1.5] tracking-[0.04em] text-primary">{header.title}</h2>
          </div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 px-2 text-[16px]">
            <span>担保机构名称：{header.guarantorName}</span>
            <span>日期：{header.date}</span>
          </div>
        </>
      ) : null}

      <div className="grid grid-cols-[88px_minmax(0,1fr)] border border-slate-900">
        <div className="border-r border-slate-900">
          <VerticalSectionLabel label="代偿补偿项目情况" />
        </div>
        <div>
          {visible.has('debtorProfile') ? (
            <section className="border-b border-slate-900 px-4 py-4">
              <div className="space-y-4">
                <ApprovalSectionTitle>一、债务人基本情况</ApprovalSectionTitle>
                <div className="space-y-4 text-[16px] leading-[2.2] text-on-surface">
                  {sections.debtorProfile.map((item) => (
                    <p key={item} className="indent-8">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {visible.has('borrowRows') ? (
            <section className="border-b border-slate-900 px-4 py-4">
              <div className="space-y-4">
                <ApprovalSectionTitle>二、借款情况</ApprovalSectionTitle>
                <ReportTable
                  headers={['序号', '项目', '内容']}
                  rows={sections.borrowRows.map((row) => [row.index, row.item, row.content])}
                />
              </div>
            </section>
          ) : null}

          {visible.has('counterGuarantee') ? (
            <section className="border-b border-slate-900 px-4 py-4">
              <div className="space-y-4">
                <ApprovalSectionTitle>三、反担保措施</ApprovalSectionTitle>
                <div className="space-y-4 text-[16px] leading-[2.2] text-on-surface">
                  {sections.counterGuarantee.map((item) => (
                    <p key={item} className="indent-8">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {visible.has('filingInfo') ? (
            <section className="border-b border-slate-900 px-4 py-4">
              <div className="space-y-4">
                <ApprovalSectionTitle>四、备案情况</ApprovalSectionTitle>
                <div className="space-y-4 text-[16px] leading-[2.2] text-on-surface">
                  {sections.filingInfo.map((item) => (
                    <p key={item} className="indent-8">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {visible.has('compensationReason') ? (
            <section className="border-b border-slate-900 px-4 py-4">
              <div className="space-y-4">
                <ApprovalSectionTitle>五、代偿原因</ApprovalSectionTitle>
                <div className="space-y-4 text-[16px] leading-[2.2] text-on-surface">
                  {sections.compensationReason.map((item) => (
                    <p key={item} className="indent-8">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {visible.has('riskRows') ? (
            <section className="border-b border-slate-900 px-4 py-4">
              <div className="space-y-4">
                <ApprovalSectionTitle>六、分险比例与分险金额</ApprovalSectionTitle>
                <ReportTable
                  headers={['代偿时间', '债务人未清偿本金（含银行债权人部分）', '原担保机构代偿金额（本金）', '省级再担保机构责任比例', '省级再担保机构代偿补偿金额（本金）']}
                  rows={sections.riskRows.map((row) => [
                    row.compensationDate,
                    row.uncompensatedPrincipal,
                    row.indemnityAmount,
                    row.ratio,
                    row.compensationAmount,
                  ])}
                />
                <div className="space-y-4 text-[16px] leading-[2.2] text-on-surface">
                  {sections.riskExplanation.map((item) => (
                    <p key={item} className="indent-8">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {visible.has('recoveryPlan') ? (
            <section className="px-4 py-4">
              <div className="space-y-4">
                <ApprovalSectionTitle>七、追偿方案</ApprovalSectionTitle>
                <div className="space-y-4 text-[16px] leading-[2.2] text-on-surface">
                  {sections.recoveryPlan.map((item) => (
                    <p key={item} className="indent-8">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {visible.has('conclusion') ? (
        <div className="mt-8 grid grid-cols-[88px_minmax(0,1fr)] border border-slate-900">
          <div className="border-r border-slate-900">
            <VerticalSectionLabel label="结论" compact />
          </div>
          <section className="px-4 py-4">
            <div className="space-y-4">
              <ApprovalSectionTitle>结论</ApprovalSectionTitle>
              <div className="space-y-4 text-[16px] leading-[2.2]">
                {sections.conclusion.map((item) => (
                  <p key={item} className="indent-8 font-semibold text-primary">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
      <div ref={scrollAnchorRef} />
    </article>
  );
}

export default function CompensationApprovalPreviewClient({ analysis, initialReport }: Props) {
  const [report, setReport] = useState<GeneratedCompensationReport | null>(initialReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(initialReport ? 100 : 0);
  const [statusText, setStatusText] = useState(initialReport ? '已加载最新缓存审批表' : '点击按钮开始生成审批表');
  const [revealCount, setRevealCount] = useState(initialReport ? REVEAL_ORDER.length : 0);

  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const previewSectionRef = useRef<HTMLElement | null>(null);
  const playbackTimerRef = useRef<number | null>(null);
  const playbackQueueRef = useRef<PlaybackStep[]>([]);
  const playbackIndexRef = useRef(0);
  const playbackCharIndexRef = useRef(0);
  const streamDoneRef = useRef(false);
  const latestCachedRef = useRef(false);

  const manualReviewPoints = useMemo(
    () => analysis.rules.filter((item) => item.conclusion === '待确认').map((item) => item.name),
    [analysis.rules],
  );

  const keyFacts = useMemo(() => buildKeyFacts(analysis), [analysis]);

  const stopPlayback = useCallback(() => {
    if (playbackTimerRef.current) {
      window.clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }, []);

  const finishPlaybackIfReady = useCallback((finalReport?: GeneratedCompensationReport) => {
    if (!streamDoneRef.current || playbackIndexRef.current < playbackQueueRef.current.length) return;
    stopPlayback();
    if (finalReport) {
      setReport(finalReport);
      setRevealCount(REVEAL_ORDER.length);
    }
    setLoading(false);
    setProgress(100);
    setStatusText(
      latestCachedRef.current
        ? '已加载最新缓存审批表'
        : `审批表已生成（${new Date((finalReport ?? report)?.generatedAt ?? new Date().toISOString()).toLocaleString('zh-CN')}）`,
    );
  }, [report, stopPlayback]);

  const startPlayback = useCallback((targetReport: GeneratedCompensationReport, cached: boolean) => {
    latestCachedRef.current = cached;
    stopPlayback();
    playbackQueueRef.current = buildPlaybackQueue(targetReport);
    playbackIndexRef.current = 0;
    playbackCharIndexRef.current = 0;
    setReport(buildEmptyReportSkeleton(targetReport));
    setRevealCount(0);
    setProgress(18);
    setStatusText(cached ? '正在载入缓存审批表内容...' : '正在逐段写入审批表正文...');

    playbackTimerRef.current = window.setInterval(() => {
      const queue = playbackQueueRef.current;
      const step = queue[playbackIndexRef.current];
      if (!step) {
        finishPlaybackIfReady(targetReport);
        return;
      }

      if (step.type === 'header') {
        setReport((current) => {
          const base = current ?? buildEmptyReportSkeleton(targetReport);
          return {
            ...base,
            structured: {
              ...base.structured,
              header: { ...targetReport.structured.header },
            },
          };
        });
        setRevealCount((current) => Math.max(current, revealIndexForSection('header')));
        playbackIndexRef.current += 1;
        setProgress((current) => Math.max(current, 24));
        return;
      }

      if (step.type === 'paragraph') {
        playbackCharIndexRef.current += TEXT_CHUNK_SIZE;
        const nextText = step.text.slice(0, playbackCharIndexRef.current);
        setReport((current) => {
          const base = current ?? buildEmptyReportSkeleton(targetReport);
          return {
            ...base,
            structured: {
              ...base.structured,
              sections: {
                ...base.structured.sections,
                [step.section]: nextParagraphArray(base.structured.sections[step.section], step.index, nextText),
              },
            },
          };
        });
        setRevealCount((current) => Math.max(current, revealIndexForSection(step.section)));
        setProgress((current) => Math.min(96, current + 1));
        if (nextText.length >= step.text.length) {
          playbackIndexRef.current += 1;
          playbackCharIndexRef.current = 0;
        }
        return;
      }

      if (step.type === 'borrowRow') {
        setReport((current) => {
          const base = current ?? buildEmptyReportSkeleton(targetReport);
          return {
            ...base,
            structured: {
              ...base.structured,
              sections: {
                ...base.structured.sections,
                borrowRows: [...base.structured.sections.borrowRows, step.row],
              },
            },
          };
        });
        setRevealCount((current) => Math.max(current, revealIndexForSection('borrowRows')));
        playbackIndexRef.current += 1;
        setProgress((current) => Math.min(96, current + 2));
        return;
      }

      setReport((current) => {
        const base = current ?? buildEmptyReportSkeleton(targetReport);
        return {
          ...base,
          structured: {
            ...base.structured,
            sections: {
              ...base.structured.sections,
              riskRows: [...base.structured.sections.riskRows, step.row],
            },
          },
        };
      });
      setRevealCount((current) => Math.max(current, revealIndexForSection('riskRows')));
      playbackIndexRef.current += 1;
      setProgress((current) => Math.min(96, current + 2));
    }, PLAYBACK_INTERVAL_MS);
  }, [finishPlaybackIfReady, stopPlayback]);

  const generate = useCallback(async (force: boolean) => {
    setLoading(true);
    setError(null);
    setProgress(6);
    setStatusText(force ? '正在重新生成代偿补偿审批表...' : '正在准备生成代偿补偿审批表...');
    setReport(null);
    setRevealCount(0);
    stopPlayback();
    playbackQueueRef.current = [];
    playbackIndexRef.current = 0;
    playbackCharIndexRef.current = 0;
    streamDoneRef.current = false;
    previewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const response = await fetch('/api/compensation-report/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force }),
    });

    if (!response.ok || !response.body) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? '审批表生成失败');
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
            setStatusText(event.data.text ?? '正在生成审批表...');
            setProgress((current) => Math.max(current, 22));
            continue;
          }

          if (event.event === 'chunk') {
            if (!event.data.report) {
              throw new Error('审批表流式内容为空');
            }
            if (playbackQueueRef.current.length === 0) {
              startPlayback(event.data.report, Boolean(event.data.cached));
            }
            continue;
          }

          if (event.event === 'complete') {
            if (!event.data.report) {
              throw new Error('审批表生成结果为空');
            }
            if (playbackQueueRef.current.length === 0) {
              startPlayback(event.data.report, Boolean(event.data.cached));
            }
            latestCachedRef.current = Boolean(event.data.cached);
            streamDoneRef.current = true;
            finishPlaybackIfReady(event.data.report);
            continue;
          }

          if (event.event === 'error') {
            throw new Error(event.data.message ?? '审批表生成失败');
          }
        }
      }
    } catch (generationError) {
      setError((generationError as Error).message);
      setLoading(false);
      stopPlayback();
    } finally {
      reader.releaseLock();
    }
  }, [finishPlaybackIfReady, startPlayback, stopPlayback]);

  useEffect(() => {
    if (!loading || revealCount === 0) return;
    const frame = window.requestAnimationFrame(() => {
      scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, revealCount]);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_320px]">
      <section ref={previewSectionRef} className="overflow-hidden rounded-3xl border border-outline-variant/10 bg-white shadow-[0_20px_40px_rgba(11,28,48,0.06)]">
        <div className="border-b border-outline-variant/5 bg-surface-container-low px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">代偿补偿审批表预览</p>
              <p className="mt-1 text-sm font-bold text-primary">生成《宝鸡三家村餐饮管理有限公司项目再担保代偿补偿审批表》</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void generate(true)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(11,28,48,0.16)] disabled:opacity-60"
              >
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {report ? '重新生成审批表' : '生成审批表'}
              </button>
              <a href="/api/compensation-report/export" className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/30 bg-white px-5 py-3 text-sm font-black text-primary">
                <Download className="h-4 w-4" />
                导出审批表
              </a>
            </div>
          </div>
        </div>

        <div className="border-b border-outline-variant/5 px-8 py-5">
          <p className="text-sm font-bold text-primary">{statusText}</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-low">
            <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white p-8 md:p-12">
          {!report && !loading ? (
            <div className="flex min-h-[52vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-outline-variant/30 bg-surface-container-low px-8 py-10 text-center">
              <FileText className="h-10 w-10 text-secondary" />
              <p className="mt-5 text-lg font-black text-primary">尚未生成审批表</p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-on-surface-variant">
                点击“生成审批表”后，系统会基于案件缓存中的材料清单、一致性核验结果和风险项，调用模型生成正式审批表内容。
              </p>
            </div>
          ) : null}

          {report ? <ApprovalPreview report={report} revealCount={Math.max(revealCount, report ? 1 : 0)} scrollAnchorRef={scrollAnchorRef} /> : null}

          {loading && !report ? (
            <div className="flex min-h-[52vh] items-center justify-center rounded-[2rem] border border-outline-variant/15 bg-surface-container-low px-8 py-10">
              <div className="text-center">
                <p className="text-lg font-black text-primary">正在准备审批表结构...</p>
                <p className="mt-2 text-sm text-on-surface-variant">{statusText}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-low text-secondary">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">写入审批表的关键依据</p>
              <p className="text-sm font-black text-primary">本次生成采用的核心口径</p>
            </div>
          </div>
          <div className="space-y-3">
            {keyFacts.map((item) => (
              <div key={item} className="rounded-2xl bg-surface-container-low px-4 py-4 text-sm font-semibold leading-6 text-on-surface">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">待人工复核点</p>
          <div className="mt-4 space-y-3">
            {manualReviewPoints.length > 0 ? (
              manualReviewPoints.map((item) => (
                <div key={item} className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  {item}
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface">
                当前规则结果未返回额外待确认项。
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">关键引用材料</p>
          <div className="mt-4 space-y-3">
            {analysis.materials
              .filter((item) => item.matchedFiles.length > 0)
              .slice(0, 6)
              .map((item) => (
                <div key={item.name} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface">
                  <p className="font-black text-primary">{item.name}</p>
                  <p className="mt-1 text-xs font-medium text-on-surface-variant">{item.matchedFiles[0]}</p>
                </div>
              ))}
          </div>
        </div>
      </aside>

      {error ? (
        <div className="xl:col-span-2 rounded-2xl border border-error/20 bg-error-container/30 px-4 py-4">
          <p className="text-sm font-black text-error">生成失败</p>
          <p className="mt-2 text-sm leading-6 text-on-error-container">{error}</p>
        </div>
      ) : null}
    </div>
  );
}
