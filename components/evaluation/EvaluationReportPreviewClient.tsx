'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Download, Loader2, FileText } from 'lucide-react';

type StreamMessage =
  | { type: 'status'; text: string }
  | { type: 'chunk'; html: string }
  | { type: 'complete'; institutionId: string; institutionName: string; indicators?: Record<string, any> }
  | { type: 'error'; message: string };

interface EvaluationReportPreviewClientProps {
  institutionId: string;
  selectedGroup: string | null;
  currentPage: string | null;
}

export default function EvaluationReportPreviewClient({ institutionId, selectedGroup, currentPage }: EvaluationReportPreviewClientProps) {
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState('');
  const [reportHtml, setReportHtml] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [indicators, setIndicators] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  function parseFrames(buffer: string) {
    const frames = buffer.split('\n\n');
    return {
      frames: frames.slice(0, -1),
      rest: frames[frames.length - 1] ?? '',
    };
  }

  function parseEvent(frame: string): StreamMessage | null {
    const dataLine = frame
      .split('\n')
      .find((line) => line.startsWith('data:'));

    if (!dataLine) return null;

    try {
      return JSON.parse(dataLine.slice(5).trim()) as StreamMessage;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const res = await fetch('/api/evaluation-report/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ institutionId }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parsed = parseFrames(buffer);
          buffer = parsed.rest;

          for (const frame of parsed.frames) {
            const data = parseEvent(frame);
            if (!data) continue;

            if (data.type === 'status') {
              setStatusText(data.text);
              continue;
            }

            if (data.type === 'chunk') {
              setReportHtml((current) => current + data.html);
              continue;
            }

            if (data.type === 'complete') {
              setInstitutionName(data.institutionName);
              setIndicators((data as any).indicators || null);
              setLoading(false);
              continue;
            }

            if (data.type === 'error') {
              throw new Error(data.message);
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError((err as Error).message || '生成失败');
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [institutionId]);

  useEffect(() => {
    if (!reportHtml) return;
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [reportHtml]);

  const handleDownload = () => {
    window.open(`/api/evaluation-report/export-html?id=${institutionId}`, '_blank');
  };

  const handleClose = () => {
    // 构建返回 URL，保留 group 和 page 参数
    let url = '/evaluation-report';
    const params = new URLSearchParams();
    if (selectedGroup) params.set('group', selectedGroup);
    if (currentPage) params.set('page', currentPage);
    if (params.toString()) url += `?${params.toString()}`;
    // 使用 window.location.href 直接跳转，确保 URL 变化触发页面重新渲染
    window.location.href = url;
  };

  if (error) {
    return (
      <section className="rounded-3xl bg-white p-10 text-center shadow-sm">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="text-3xl font-black text-red-600">!</span>
          </div>
          <p className="text-lg font-bold text-on-surface">生成失败</p>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={handleClose}
            className="mt-6 inline-flex items-center rounded-xl bg-primary px-6 py-3 text-sm font-black text-white hover:bg-primary/90"
          >
            关闭
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* 左侧：报告预览 */}
      <section className="col-span-12 xl:col-span-8 overflow-hidden rounded-3xl bg-white shadow-sm">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant/20 bg-white px-8 py-4 shadow-sm">
          <div>
            <h1 className="text-lg font-black text-primary">{institutionName || '评价报告'}</h1>
            <p className="text-xs text-on-surface-variant">{loading ? statusText || 'AI 正在逐段生成报告...' : 'AI 自动生成'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-2 text-xs font-black text-primary hover:bg-primary hover:text-white transition-colors"
            >
              <Download className="h-4 w-4" />
              下载 Word
            </button>
            <button
              onClick={handleClose}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-white px-4 py-2 text-xs font-black text-on-surface-variant hover:bg-surface-container-low"
            >
              <X className="h-4 w-4" />
              返回列表
            </button>
          </div>
        </header>

        <div className="bg-white p-8 md:p-12">
          {loading && !reportHtml ? (
            <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center rounded-[2rem] border border-dashed border-outline-variant/30 bg-surface-container-low px-8 py-10 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="mt-5 text-lg font-black text-primary">{statusText || '正在生成评价报告...'}</p>
            </div>
          ) : reportHtml ? (
            <article
              ref={scrollerRef}
              className="mx-auto min-h-[60vh] max-w-3xl rounded-[1.75rem] border border-outline-variant/15 bg-white px-8 py-10 font-['Songti_SC','STSong','SimSun',serif] text-[15px] leading-[2] text-on-surface shadow-[0_12px_30px_rgba(11,28,48,0.05)] md:px-12 md:py-14"
              dangerouslySetInnerHTML={{ __html: reportHtml }}
            />
          ) : null}
        </div>
      </section>

      {/* 右侧：口径摘要和指标 */}
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
            <div className="rounded-2xl bg-surface-container-low px-4 py-4 text-sm font-semibold leading-6 text-on-surface">
              本年度机构评价以政策目标完成度为核心，结合 8 项核心指标进行综合评价。
            </div>
            <div className="rounded-2xl bg-surface-container-low px-4 py-4 text-sm font-semibold leading-6 text-on-surface">
              评价指标包含新增担保业务规模、小微三农占比、再担保规模、分险业务占比、担保放大倍数、代偿率控制、代偿返还率等。
            </div>
            <div className="rounded-2xl bg-surface-container-low px-4 py-4 text-sm font-semibold leading-6 text-on-surface">
              评价结果分为优秀、良好、合格、不合格四个等次，作为授信额度配置的重要依据。
            </div>
          </div>
        </div>

        {indicators && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">机构核心指标</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                <p className="text-[11px] font-black text-on-surface-variant">综合评价结果</p>
                <p className="mt-1 text-sm font-bold text-primary">{indicators.overallStatus}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                <p className="text-[11px] font-black text-on-surface-variant">新增担保业务规模完成率</p>
                <p className="mt-1 text-sm font-bold text-primary">{(indicators.scaleCompletionRate * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                <p className="text-[11px] font-black text-on-surface-variant">小微三农占比完成率</p>
                <p className="mt-1 text-sm font-bold text-primary">{(indicators.customerRatioCompletionRate * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                <p className="text-[11px] font-black text-on-surface-variant">代偿率状态</p>
                <p className="mt-1 text-sm font-bold text-primary">{indicators.compensationRateStatus}</p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">相关附件</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface">
              输入 1：{institutionName}年度业务数据统计表
            </div>
            <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface">
              输入 2：陕西省政府性融资担保机构综合评价办法
            </div>
            <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface">
              输入 3：保后评价报告模板
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
