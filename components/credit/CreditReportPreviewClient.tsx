'use client';

import Link from 'next/link';
import { Download, FileText, LoaderCircle, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import SubmitOaButton from '@/components/credit/SubmitOaButton';
import { parseCreditReportText, type GeneratedCreditReport } from '@/lib/credit-report-format';

type Props = {
  initialReport: GeneratedCreditReport | null;
  autoGenerate: boolean;
  adoptedCriteria: string[];
  references: string[];
  oaMemo: string;
};

type StreamEvent =
  | { event: 'status'; data: { text?: string } }
  | { event: 'chunk'; data: { text?: string } }
  | { event: 'complete'; data: { text?: string; cached?: boolean } }
  | { event: 'error'; data: { message?: string } };

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
        },
      };
    }
    if (event === 'error') return { event, data: { message: typeof data.message === 'string' ? data.message : undefined } };
    return null;
  } catch {
    return null;
  }
}

export default function CreditReportPreviewClient({ initialReport, autoGenerate, adoptedCriteria, references, oaMemo }: Props) {
  const [report, setReport] = useState<GeneratedCreditReport | null>(initialReport);
  const [displayText, setDisplayText] = useState(initialReport?.rawText ?? '');
  const [loading, setLoading] = useState(autoGenerate || !initialReport);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(autoGenerate || !initialReport ? 6 : 100);
  const [statusText, setStatusText] = useState(autoGenerate || !initialReport ? '正在准备流式生成授信报告...' : '授信报告已就绪');

  const pendingTextRef = useRef('');
  const fullTextRef = useRef(initialReport?.rawText ?? '');
  const streamDoneRef = useRef(false);
  const visibleTextRef = useRef(initialReport?.rawText ?? '');
  const streamTailRef = useRef<HTMLDivElement | null>(null);

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

      const chunk = pendingTextRef.current.slice(0, 4);
      pendingTextRef.current = pendingTextRef.current.slice(4);
      setDisplayText((current) => {
        const next = current + chunk;
        visibleTextRef.current = next;
        return next;
      });
      setProgress((current) => Math.min(streamDoneRef.current ? 100 : 96, current + 1));
    }, 18);

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
            const visibleText = visibleTextRef.current + pendingTextRef.current;
            if (!finalText.startsWith(visibleText)) {
              pendingTextRef.current = finalText.slice(visibleTextRef.current.length);
            }
            setReport({
              rawText: finalText,
              generatedAt: new Date().toISOString(),
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

  return (
    <>
      <section className="col-span-12 xl:col-span-8">
        <div className="overflow-hidden rounded-3xl border border-outline-variant/10 bg-white shadow-[0_20px_40px_rgba(11,28,48,0.06)]">
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
                        {block.text}
                      </p>
                    );
                  }

                  return (
                    <p key={`${block.kind}-${index}`} className="mb-2 indent-8">
                      {block.text}
                    </p>
                  );
                })}

                {parsed.attachmentLine ? <p className="mt-6">{parsed.attachmentLine}</p> : null}
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

      <aside className="col-span-12 space-y-6 xl:col-span-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-low text-secondary">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">本次采用口径摘要</p>
              <p className="text-sm font-black text-primary">写入报告的关键依据</p>
            </div>
          </div>
          <div className="space-y-3">
            {adoptedCriteria.map((item) => (
              <div key={item} className="rounded-2xl bg-surface-container-low px-4 py-4 text-sm font-semibold leading-6 text-on-surface">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">相关附件</p>
          <div className="mt-4 space-y-3">
            {references.map((item) => (
              <div key={item} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface">
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
