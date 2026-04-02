'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';

type StreamMessage =
  | { type: 'status'; text: string }
  | { type: 'chunk'; html: string }
  | { type: 'complete'; institutionId: string; institutionName: string }
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
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
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

      <div ref={scrollerRef} className="max-h-[80vh] overflow-y-auto">
        <main className="px-0 py-0">
          {loading && !reportHtml ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-white">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-base font-bold text-on-surface">{statusText || '正在生成评价报告...'}</p>
            </div>
          ) : null}
          <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
        </main>
      </div>
    </section>
  );
}
