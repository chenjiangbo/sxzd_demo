'use client';

import { Download, FileText, LoaderCircle, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

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

export default function BriefPreviewClient() {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(6);
  const [statusText, setStatusText] = useState('正在准备流式生成担保业务简报...');
  const [iframeHeight, setIframeHeight] = useState(1200);

  const pendingTextRef = useRef('');
  const fullTextRef = useRef('');
  const streamDoneRef = useRef(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHtmlContent('');
    setProgress(6);
    setStatusText('正在准备流式生成担保业务简报...');
    pendingTextRef.current = '';
    fullTextRef.current = '';
    streamDoneRef.current = false;

    try {
      const response = await fetch('/api/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: 'first-half',
          periodText: '2026 年上半年',
          year: '2026',
        }),
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? '简报生成失败');
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
            setStatusText(event.data.text ?? '正在生成担保业务简报...');
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
            throw new Error(event.data.message ?? '简报生成失败');
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
    a.download = `担保业务简报 -2026 年上半年.doc`;
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
      {/* 左侧：进度和状态 */}
      <div className="col-span-3">
        <div className="sticky top-24 space-y-6">
          {/* 进度卡片 */}
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">生成进度</span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">{progress}%</span>
            </div>

            <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-container-low">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-sm font-medium text-on-surface-variant">{statusText}</p>

            {loading && (
              <div className="mt-4 flex items-center gap-2 text-xs text-secondary">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                正在生成中...
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          {!loading && htmlContent && (
            <div className="space-y-3">
              {/*<button*/}
              {/*  onClick={handleDownload}*/}
              {/*  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"*/}
              {/*>*/}
              {/*  <Download className="h-5 w-5" />*/}
              {/*  下载 Word 简报*/}
              {/*</button>*/}
              <button
                onClick={() => void generate()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-variant/20 bg-white px-5 py-4 text-sm font-bold text-primary transition hover:bg-surface-container-low"
              >
                <RefreshCcw className="h-5 w-5" />
                重新生成
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 右侧：预览区域 */}
      <div className="col-span-9">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          {htmlContent ? (
            <div>
              <iframe
                id="brief-iframe"
                srcDoc={htmlContent}
                className="w-full border-0"
                title="简报预览"
                sandbox=""
                scrolling="no"
                onLoad={() => {
                  const iframe = document.getElementById('brief-iframe');
                  if (iframe) {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDoc) {
                      const height = iframeDoc.body.scrollHeight;
                      iframe.style.height = `${height}px`;
                    }
                  }
                }}
              />
            </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <LoaderCircle className="mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-bold text-on-surface-variant">正在生成简报内容</p>
            <p className="mt-2 text-sm text-on-surface-variant">请稍候，正在读取数据并渲染...</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
