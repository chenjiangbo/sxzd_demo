'use client';

import { FileText, Plus, RefreshCcw, Save, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

export type BriefPromptResource = {
  id: string;
  title: string;
  kind: 'template' | 'data' | 'structured';
  path?: string;
  purpose: string;
};

export type BriefPromptConfig = {
  businessRequirements: string[];
  technicalRequirements: string[];
  templateConstraints: string[];
  resources: BriefPromptResource[];
};

type Props = {
  config: BriefPromptConfig;
  onRegenerate: () => void;
  loading: boolean;
};

function formatResourceKind(kind: BriefPromptResource['kind']) {
  if (kind === 'template') return '模板';
  if (kind === 'data') return '资料';
  return '结构化数据';
}

function PromptLine({
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

export default function BriefAiInstructionPanel({ config, onRegenerate, loading }: Props) {
  const [draft, setDraft] = useState(config);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const groupedResources = useMemo(
    () => ({
      templates: draft.resources.filter((item) => item.kind === 'template'),
      references: draft.resources.filter((item) => item.kind !== 'template'),
    }),
    [draft.resources],
  );

  function toggle(key: string) {
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <>
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-low text-secondary">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">AI 指令</p>
            <p className="text-sm font-black text-primary">生成简报时给模型的业务要求</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">业务要求</p>
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => ({
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
            {draft.businessRequirements.map((item, index) => (
              <PromptLine
                key={`business-${index}`}
                prefix={String(index + 1).padStart(2, '0')}
                value={item}
                expanded={expandedKeys.has(`business-${index}`)}
                onToggle={() => toggle(`business-${index}`)}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    businessRequirements: current.businessRequirements.map((line, lineIndex) =>
                      lineIndex === index ? value : line,
                    ),
                  }))
                }
                onRemove={() =>
                  setDraft((current) => ({
                    ...current,
                    businessRequirements: current.businessRequirements.filter((_, lineIndex) => lineIndex !== index),
                  }))
                }
              />
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">格式要求</p>
            {draft.templateConstraints.map((item, index) => (
              <PromptLine
                key={`format-${index}`}
                prefix={`格${String(index + 1).padStart(2, '0')}`}
                value={item}
                expanded={expandedKeys.has(`format-${index}`)}
                onToggle={() => toggle(`format-${index}`)}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    templateConstraints: current.templateConstraints.map((line, lineIndex) =>
                      lineIndex === index ? value : line,
                    ),
                  }))
                }
                onRemove={() =>
                  setDraft((current) => ({
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
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-white px-4 py-2 text-xs font-black text-primary transition hover:bg-surface-container-low"
          >
            <Save className="h-4 w-4" />
            保存
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            重新生成
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
    </>
  );
}
