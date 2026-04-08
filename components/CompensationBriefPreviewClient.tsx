'use client';

import { Download, FileText, LoaderCircle, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  adoptedCriteria: string[];
  references: string[];
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

export default function CompensationBriefPreviewClient({ adoptedCriteria, references }: Props) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(6);
  const [statusText, setStatusText] = useState('正在准备流式生成代偿补偿简报...');

  const pendingTextRef = useRef('');
  const fullTextRef = useRef('');
  const streamDoneRef = useRef(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHtmlContent('');
    setProgress(6);
    setStatusText('正在准备流式生成代偿补偿简报...');
    pendingTextRef.current = '';
    fullTextRef.current = '';
    streamDoneRef.current = false;

    try {
      const response = await fetch('/api/generate-compensation-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: '2026',
        }),
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? '代偿补偿简报生成失败');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
            setStatusText(event.data.text ?? '正在生成代偿补偿简报...');
            setProgress((current) => Math.max(current, 12));
            continue;
          }

          if (event.event === 'chunk') {
            const text = event.data.text ?? '';
            if (!text) continue;
            fullTextRef.current += text;
            pendingTextRef.current += text;
            setStatusText('正在逐段生成简报正文...');
            setProgress((current) => Math.min(94, Math.max(current, 18)));
            continue;
          }

          if (event.event === 'complete') {
            const finalText = event.data.text ?? fullTextRef.current;
            fullTextRef.current = finalText;
            setHtmlContent(finalText);
            setStatusText(event.data.cached ? '已加载最新缓存简报' : '模型已完成生成，正在整理排版...');
            streamDoneRef.current = true;
            setProgress(100);
            setLoading(false);
            continue;
          }

          if (event.event === 'error') {
            throw new Error(event.data.message ?? '代偿补偿简报生成失败');
          }
        }
      }
    } catch (generationError) {
      setError((generationError as Error).message);
      setLoading(false);
      streamDoneRef.current = false;
    }
  }, []);

  useEffect(() => {
    void generate();
  }, [generate]);

  const handleDownload = () => {
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `代偿补偿简报.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="rounded-3xl bg-error-container p-8 text-center">
        <p className="mb-4 text-lg font-bold text-on-error-container">{error}</p>
        <button
          onClick={() => void generate()}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-error shadow-sm transition hover:shadow-md"
        >
          <RefreshCcw className="h-5 w-5" />
          重新生成
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* 左侧：预览区域 */}
      <section className="col-span-12 xl:col-span-8">
        <div className="overflow-hidden rounded-3xl border border-outline-variant/10 bg-white shadow-[0_20px_40px_rgba(11,28,48,0.06)]">
          <div className="border-b border-outline-variant/5 bg-surface-container-low px-8 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">代偿补偿简报预览</p>
          </div>

          <div className="bg-white p-8 md:p-12">
            {!htmlContent && loading ? (
              <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center rounded-[2rem] border border-dashed border-outline-variant/30 bg-surface-container-low px-8 py-10 text-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-secondary" />
                <p className="mt-5 text-lg font-black text-primary">正在生成代偿补偿简报</p>
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
            ) : htmlContent ? (
              <div>
                <iframe
                  id="compensation-brief-iframe"
                  srcDoc={htmlContent}
                  className="w-full border-0"
                  title="代偿补偿简报预览"
                  sandbox="allow-same-origin"
                  scrolling="no"
                  onLoad={() => {
                    const iframe = document.getElementById('compensation-brief-iframe') as HTMLIFrameElement | null;
                    if (iframe) {
                      try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                        if (iframeDoc) {
                          const height = iframeDoc.body.scrollHeight;
                          iframe.style.height = `${height}px`;
                        }
                      } catch (e) {
                        // 忽略跨域错误
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <LoaderCircle className="mb-4 h-12 w-12 animate-spin text-primary" />
                <p className="text-lg font-bold text-on-surface-variant">正在生成代偿补偿简报内容</p>
                <p className="mt-2 text-sm text-on-surface-variant">请稍候，正在读取数据并渲染...</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl border border-outline-variant/30 bg-white px-5 py-3 text-sm font-black text-primary disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            重新生成
          </button>
          <button
            onClick={handleDownload}
            disabled={!htmlContent}
            className="flex items-center gap-2 rounded-2xl border border-outline-variant/30 bg-white px-5 py-3 text-sm font-black text-primary disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            导出 Word
          </button>
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
    </div>
  );
}
