'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileText, Loader2, Plus, RefreshCcw, Save, Trash2, X } from 'lucide-react';

type StreamMessage =
  | { type: 'status'; text: string }
  | { type: 'chunk'; html: string }
  | { type: 'complete'; institutionId: string; institutionName: string; indicators?: Record<string, unknown> }
  | { type: 'error'; message: string };

type EvaluationPromptResource = {
  id: string;
  title: string;
  kind: 'template' | 'data' | 'structured';
  path?: string;
  purpose: string;
};

type EvaluationPromptConfig = {
  businessRequirements: string[];
  technicalRequirements: string[];
  templateConstraints: string[];
  resources: EvaluationPromptResource[];
};

interface EvaluationReportPreviewClientProps {
  institutionId: string;
  selectedGroup: string | null;
  currentPage: string | null;
  promptConfig: EvaluationPromptConfig;
}

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

function formatResourceKind(kind: EvaluationPromptResource['kind']) {
  if (kind === 'template') return '模板';
  if (kind === 'data') return '资料';
  return '结构化数据';
}

function PromptLineEditor({
  prefix,
  value,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: {
  prefix: string;
  value: string;
  expanded: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low px-3 py-3">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle();
          }
        }}
        className="flex cursor-pointer items-start gap-3"
      >
        <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-black tracking-[0.12em] text-primary">
          {prefix}
        </span>
        <div className="min-w-0 flex-1">
          {expanded ? (
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              rows={Math.max(3, Math.ceil(value.length / 26))}
              className="w-full resize-none rounded-xl border border-outline-variant/20 bg-white px-3 py-2 text-sm leading-6 text-on-surface outline-none transition focus:border-primary"
            />
          ) : (
            <p className="truncate text-sm font-semibold leading-6 text-on-surface" title={value}>
              {value}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="shrink-0 rounded-full p-1.5 text-on-surface-variant transition hover:bg-white hover:text-red-600"
          aria-label="删除指令"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function EvaluationReportPreviewClient({
  institutionId,
  selectedGroup,
  currentPage,
  promptConfig,
}: EvaluationReportPreviewClientProps) {
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState('');
  const [reportHtml, setReportHtml] = useState('');
  const [renderHtml, setRenderHtml] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [promptDraft, setPromptDraft] = useState<EvaluationPromptConfig>(promptConfig);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [expandedPromptKeys, setExpandedPromptKeys] = useState<Set<string>>(() => new Set());
  const revealIndexRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setPromptDraft(promptConfig);
  }, [promptConfig]);

  const groupedResources = useMemo(
    () => ({
      templates: promptDraft.resources.filter((item) => item.kind === 'template'),
      references: promptDraft.resources.filter((item) => item.kind !== 'template'),
    }),
    [promptDraft.resources],
  );

  const startGeneration = useCallback(
    async (force = false) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setLoading(true);
      setStatusText('');
      setReportHtml('');
      setRenderHtml('');
      setInstitutionName('');
      setError(null);
      revealIndexRef.current = 0;

      try {
        const res = await fetch('/api/evaluation-report/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ institutionId, force }),
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
    },
    [institutionId],
  );

  useEffect(() => {
    void startGeneration(false);
    return () => {
      controllerRef.current?.abort();
    };
  }, [startGeneration]);

  useEffect(() => {
    if (!reportHtml) return;
    if (renderHtml.length >= reportHtml.length) return;

    const timer = window.setInterval(() => {
      const remaining = reportHtml.length - revealIndexRef.current;
      if (remaining <= 0) {
        window.clearInterval(timer);
        return;
      }

      const nextSize = Math.min(remaining, 120);
      revealIndexRef.current += nextSize;
      setRenderHtml(reportHtml.slice(0, revealIndexRef.current));
    }, 45);

    return () => window.clearInterval(timer);
  }, [renderHtml.length, reportHtml]);

  const togglePromptLine = useCallback((key: string) => {
    setExpandedPromptKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const savePromptConfig = useCallback(async (nextDraft: EvaluationPromptConfig) => {
    const payload: EvaluationPromptConfig = {
      ...nextDraft,
      businessRequirements: nextDraft.businessRequirements.map((item) => item.trim()).filter(Boolean),
      templateConstraints: nextDraft.templateConstraints.map((item) => item.trim()).filter(Boolean),
    };

    if (payload.businessRequirements.length === 0) {
      throw new Error('至少保留一条业务要求');
    }
    if (payload.templateConstraints.length === 0) {
      throw new Error('至少保留一条格式要求');
    }

    const response = await fetch('/api/evaluation-report/prompt-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('保存 AI 指令失败');
    }

    const data = (await response.json()) as { config: EvaluationPromptConfig };
    setPromptDraft(data.config);
    return data.config;
  }, []);

  const handleSavePrompt = useCallback(async () => {
    setSavingPrompt(true);
    try {
      await savePromptConfig(promptDraft);
    } finally {
      setSavingPrompt(false);
    }
  }, [promptDraft, savePromptConfig]);

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    try {
      await savePromptConfig(promptDraft);
      await startGeneration(true);
    } finally {
      setRegenerating(false);
    }
  }, [promptDraft, savePromptConfig, startGeneration]);

  const handleResetPrompt = useCallback(async () => {
    setSavingPrompt(true);
    try {
      const response = await fetch('/api/evaluation-report/prompt-config', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('恢复默认指令失败');
      }
      const data = (await response.json()) as { config: EvaluationPromptConfig };
      setPromptDraft(data.config);
      setExpandedPromptKeys(new Set());
    } finally {
      setSavingPrompt(false);
    }
  }, []);

  const handleDownload = useCallback(() => {
    window.open(`/api/evaluation-report/export-html?id=${institutionId}`, '_blank');
  }, [institutionId]);

  const handleClose = useCallback(() => {
    let url = '/evaluation-report';
    const params = new URLSearchParams();
    if (selectedGroup) params.set('group', selectedGroup);
    if (currentPage) params.set('page', currentPage);
    if (params.toString()) url += `?${params.toString()}`;
    window.location.href = url;
  }, [currentPage, selectedGroup]);

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
      <section className="col-span-12 xl:col-span-8">
        <header className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-outline-variant/20 bg-white px-8 py-4 shadow-sm">
          <div>
            <h1 className="text-lg font-black text-primary">{institutionName || '评价报告'}</h1>
            <p className="text-xs text-on-surface-variant">{loading ? statusText || 'AI 正在逐段生成报告...' : 'AI 自动生成'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-2 text-xs font-black text-primary transition-colors hover:bg-primary hover:text-white"
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
              className="mx-auto min-h-[60vh] max-w-3xl bg-white px-8 py-10 font-['Songti_SC','STSong','SimSun',serif] text-[15px] leading-[2] text-on-surface md:px-12 md:py-14"
              dangerouslySetInnerHTML={{ __html: renderHtml || reportHtml }}
            />
          ) : null}
        </div>
      </section>

      <aside className="col-span-12 space-y-6 xl:col-span-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-low text-secondary">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">AI 指令</p>
              <p className="text-sm font-black text-primary">写给模型的业务要求与格式要求</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">业务要求</p>
                <button
                  type="button"
                  onClick={() =>
                    setPromptDraft((current) => ({
                      ...current,
                      businessRequirements: [...current.businessRequirements, '请补充新的业务要求。'],
                    }))
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  新增
                </button>
              </div>
              {promptDraft.businessRequirements.map((item, index) => (
                <PromptLineEditor
                  key={`business-${index}`}
                  prefix={`${String(index + 1).padStart(2, '0')}`}
                  value={item}
                  expanded={expandedPromptKeys.has(`business-${index}`)}
                  onToggle={() => togglePromptLine(`business-${index}`)}
                  onChange={(value) =>
                    setPromptDraft((current) => ({
                      ...current,
                      businessRequirements: current.businessRequirements.map((line, lineIndex) =>
                        lineIndex === index ? value : line,
                      ),
                    }))
                  }
                  onRemove={() =>
                    setPromptDraft((current) => ({
                      ...current,
                      businessRequirements: current.businessRequirements.filter((_, lineIndex) => lineIndex !== index),
                    }))
                  }
                />
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">格式要求</p>
                <button
                  type="button"
                  onClick={() =>
                    setPromptDraft((current) => ({
                      ...current,
                      templateConstraints: [...current.templateConstraints, '请补充新的格式要求。'],
                    }))
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-black text-secondary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  新增
                </button>
              </div>
              {promptDraft.templateConstraints.map((item, index) => (
                <PromptLineEditor
                  key={`format-${index}`}
                  prefix={`格${String(index + 1).padStart(2, '0')}`}
                  value={item}
                  expanded={expandedPromptKeys.has(`format-${index}`)}
                  onToggle={() => togglePromptLine(`format-${index}`)}
                  onChange={(value) =>
                    setPromptDraft((current) => ({
                      ...current,
                      templateConstraints: current.templateConstraints.map((line, lineIndex) =>
                        lineIndex === index ? value : line,
                      ),
                    }))
                  }
                  onRemove={() =>
                    setPromptDraft((current) => ({
                      ...current,
                      templateConstraints: current.templateConstraints.filter((_, lineIndex) => lineIndex !== index),
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSavePrompt}
              disabled={savingPrompt || regenerating}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-white px-4 py-2 text-xs font-black text-primary transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              保存
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={savingPrompt || regenerating}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              重新生成
            </button>
            <button
              type="button"
              onClick={handleResetPrompt}
              disabled={savingPrompt || regenerating}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-white px-4 py-2 text-xs font-black text-on-surface-variant transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              恢复默认
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">参考模板</p>
          <div className="mt-4 space-y-3">
            {groupedResources.templates.map((item) => (
              <div key={item.id} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-black text-primary">{item.title}</p>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-black text-primary">
                    {formatResourceKind(item.kind)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-on-surface">{item.purpose}</p>
                {item.path ? <p className="mt-2 break-all text-xs leading-5 text-on-surface-variant">{item.path}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">参考资料</p>
          <div className="mt-4 space-y-3">
            {groupedResources.references.map((item) => (
              <div key={item.id} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-black text-primary">{item.title}</p>
                  <span className="shrink-0 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-black text-secondary">
                    {formatResourceKind(item.kind)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-on-surface">{item.purpose}</p>
                {item.path ? <p className="mt-2 break-all text-xs leading-5 text-on-surface-variant">{item.path}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
