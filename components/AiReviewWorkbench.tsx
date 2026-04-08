'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  FileSearch,
  FileText,
  LoaderCircle,
  MessageSquare,
  PanelRightOpen,
  Trash2,
  Send,
  Sparkles,
} from 'lucide-react';
import type {
  AiReviewContext,
  ConversationEntry,
  ExperienceItem,
  ReviewConclusion,
  ReviewDocumentType,
  ReviewIssue,
  ReviewResult,
  ReviewRound,
  ReviewStatus,
} from '@/lib/server/ai-review';
import { useRouter } from 'next/navigation';

type Props = {
  initialContext: AiReviewContext;
  startEmpty?: boolean;
};

type ReviewTab = 'chat' | 'document' | 'verification';

type ChatEntry =
  | { kind: 'system'; id: string; text: string }
  | { kind: 'user'; id: string; text: string }
  | { kind: 'assistant'; id: string; text: string }
  | { kind: 'review'; id: string; round: ReviewRound; isLatest: boolean; fromActiveSession: boolean };

type ActiveSession = {
  entries: ChatEntry[];
};

type SelectionSource = 'documents' | 'history';

function statusTone(status: ReviewStatus) {
  if (status === '可提交 OA') return 'bg-tertiary-fixed-dim/20 text-on-tertiary-container';
  if (status === '已反馈重审') return 'bg-error-container text-error';
  if (status === '已出首版意见') return 'bg-secondary/10 text-secondary';
  return 'bg-surface-container text-on-surface-variant';
}

function conclusionTone(conclusion: ReviewConclusion) {
  if (conclusion === '可提交') return 'bg-tertiary-fixed-dim/20 text-on-tertiary-container';
  if (conclusion === '建议修改后提交') return 'bg-secondary/10 text-secondary';
  return 'bg-error-container text-on-error-container';
}

function issueTone(severity: ReviewIssue['severity']) {
  if (severity === 'high') return 'bg-error-container/70 text-on-error-container';
  if (severity === 'medium') return 'bg-amber-100 text-amber-700';
  return 'bg-surface-container text-on-surface-variant';
}

function formatReviewStatusLabel(status: ReviewStatus) {
  if (status === '已出首版意见') return '已审核';
  return status;
}

function buildChatEntriesFromConversation(conversation: ConversationEntry[], rounds: ReviewRound[], options?: { fromActiveSession?: boolean }): ChatEntry[] {
  const latestRoundId = rounds.at(-1)?.id;
  const entries: ChatEntry[] = [];

  conversation.forEach((entry) => {
    if (entry.kind === 'user') {
      entries.push({ kind: 'user', id: entry.id, text: entry.text });
      return;
    }
    if (entry.kind === 'assistant') {
      entries.push({ kind: 'assistant', id: entry.id, text: entry.text });
      return;
    }

    const round = rounds.find((item) => item.id === entry.roundId);
    if (!round) return;
    entries.push({
      kind: 'review',
      id: entry.id,
      round,
      isLatest: round.id === latestRoundId,
      fromActiveSession: Boolean(options?.fromActiveSession),
    });
  });

  return entries;
}

function formatDocumentBlocks(text: string) {
  const normalized = text.replace(/\r/g, '').trim();
  if (!normalized) return [];

  return normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const firstLine = block.split('\n')[0]?.trim() ?? '';
      const isTitle = index === 0;
      const isSection = /^(一、|二、|三、|四、|五、|六、|七、|八、|九、|十、|\d+\.|附件：)/.test(firstLine);
      return { id: `${index}-${firstLine}`, text: block, isTitle, isSection };
    });
}

function ReviewCard({ round, isLatest, animate = false, onProgress }: { round: ReviewRound; isLatest: boolean; animate?: boolean; onProgress?: () => void }) {
  const review = round.review;
  const [summaryText, setSummaryText] = useState(animate ? '' : review.summary);
  const [visibleIssueCount, setVisibleIssueCount] = useState(animate ? 0 : review.issues.length + review.risks.length);
  const [visibleSuggestionCount, setVisibleSuggestionCount] = useState(animate ? 0 : review.suggestions.length);
  const [basisVisible, setBasisVisible] = useState(!animate);
  const mergedItems = useMemo(() => [...review.issues, ...review.risks], [review.issues, review.risks]);
  const displayedSummary = animate ? summaryText : review.summary;
  const displayedIssueCount = animate ? visibleIssueCount : mergedItems.length;
  const displayedSuggestionCount = animate ? visibleSuggestionCount : review.suggestions.length;
  const displayedBasisVisible = animate ? basisVisible : true;

  useEffect(() => {
    if (!animate) return;

    let cancelled = false;
    let summaryTimer: ReturnType<typeof setTimeout> | null = null;
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    const runSummary = (index: number) => {
      if (cancelled) return;
      if (index > review.summary.length) {
        mergedItems.forEach((_, itemIndex) => {
          timers.push(
            setTimeout(() => {
              if (!cancelled) {
                setVisibleIssueCount(itemIndex + 1);
              }
            }, itemIndex * 220),
          );
        });

        const issuePhaseDuration = mergedItems.length * 220;
        review.suggestions.forEach((_, suggestionIndex) => {
          timers.push(
            setTimeout(() => {
              if (!cancelled) {
                setVisibleSuggestionCount(suggestionIndex + 1);
              }
            }, issuePhaseDuration + suggestionIndex * 220),
          );
        });

        timers.push(
          setTimeout(() => {
            if (!cancelled) {
              setBasisVisible(true);
            }
          }, issuePhaseDuration + review.suggestions.length * 220 + 220),
        );
        return;
      }

      setSummaryText(review.summary.slice(0, index));
      summaryTimer = setTimeout(() => runSummary(index + 2), 18);
    };

    summaryTimer = setTimeout(() => runSummary(1), 120);

    return () => {
      cancelled = true;
      if (summaryTimer) clearTimeout(summaryTimer);
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [animate, mergedItems, review.summary, review.suggestions]);

  useEffect(() => {
    if (!animate) return;
    if (summaryText.length === 0 && visibleIssueCount === 0 && visibleSuggestionCount === 0 && !basisVisible) return;
    onProgress?.();
  }, [animate, basisVisible, onProgress, summaryText, visibleIssueCount, visibleSuggestionCount]);

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-on-surface-variant">AI 复核结果</p>
          <h3 className="mt-1 text-lg font-black text-primary">第 {round.index} 轮复核</h3>
          <p className="mt-1 text-xs text-on-surface-variant">{round.createdAt.replace('T', ' ').slice(0, 16)}</p>
        </div>
        <div className="flex items-center gap-2">
          {isLatest ? (
            <span className="rounded-full bg-tertiary-fixed-dim/20 px-2.5 py-1 text-[10px] font-black text-on-tertiary-container">最新结果</span>
          ) : null}
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${conclusionTone(review.conclusion)}`}>{review.conclusion}</span>
        </div>
      </div>

      <div className="space-y-5">
        <section className="rounded-2xl bg-surface-container-low px-4 py-4">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-on-surface-variant">审核结论</p>
          <p className="mt-2 min-h-[3rem] text-sm leading-6 text-on-surface">
            {displayedSummary}
            {animate && displayedSummary.length < review.summary.length ? <span className="ml-0.5 inline-block h-4 w-2 animate-pulse rounded-sm bg-primary/60 align-middle" /> : null}
          </p>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-secondary" />
            <h4 className="text-sm font-black text-primary">关键问题</h4>
          </div>
          <div className="space-y-3">
            {mergedItems.slice(0, displayedIssueCount).map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-2xl bg-surface-container-low px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-primary">{item.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-on-surface-variant">{item.focus}</span>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${issueTone(item.severity)}`}>{item.severity}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-on-surface">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-tertiary-fixed-dim" />
            <h4 className="text-sm font-black text-primary">修改建议</h4>
          </div>
          <div className="space-y-3">
            {review.suggestions.slice(0, displayedSuggestionCount).map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-2xl border border-tertiary-fixed-dim/20 bg-white px-4 py-4">
                <p className="text-sm font-bold text-primary">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-on-surface">{item.detail}</p>
                <p className="mt-2 text-xs leading-5 text-on-surface-variant">依据：{item.basis}</p>
              </div>
            ))}
          </div>
        </section>

        {displayedBasisVisible ? (
          <details className="rounded-2xl bg-surface-container-low px-4 py-4">
            <summary className="cursor-pointer text-sm font-black text-primary">审核依据</summary>
            <div className="mt-3 space-y-2 text-sm leading-6 text-on-surface">
              <p><span className="font-bold text-primary">模式：</span>{review.basis.mode}</p>
              <p><span className="font-bold text-primary">材料：</span>{review.basis.materials.join('；')}</p>
              <p><span className="font-bold text-primary">制度/样本：</span>{review.basis.policies.length ? review.basis.policies.join('；') : '本轮未额外引用制度条文。'}</p>
              <p><span className="font-bold text-primary">沉淀经验：</span>{review.basis.experiences.length ? review.basis.experiences.join('；') : '当前仅使用系统预置要点。'}</p>
            </div>
          </details>
        ) : null}
      </div>
    </article>
  );
}

export default function AiReviewWorkbench({ initialContext, startEmpty = false }: Props) {
  const router = useRouter();
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const [context, setContext] = useState(initialContext);
  const [input, setInput] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReviewTab>('chat');
  const [selectedType, setSelectedType] = useState<ReviewDocumentType | null>(startEmpty ? null : initialContext.current.type);
  const [selectionSource, setSelectionSource] = useState<SelectionSource>(startEmpty ? 'documents' : 'documents');
  const [showHistoryForSelected, setShowHistoryForSelected] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [flyingExperience, setFlyingExperience] = useState<{ id: string; label: string; phase: 'launch' | 'arrive' } | null>(null);
  const [deletingExperienceId, setDeletingExperienceId] = useState<string | null>(null);
  const activeDocument = useMemo(
    () => (selectedType ? context.documents.find((item) => item.type === selectedType) ?? context.current : null),
    [context, selectedType],
  );
  const shouldAnimateCurrentConversation = Boolean(activeSession) && !showHistoryForSelected;

  const scrollChatToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (activeTab !== 'chat' || !shouldAnimateCurrentConversation) return;

    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior });
    }

    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior,
    });
  }, [activeTab, shouldAnimateCurrentConversation]);

  useEffect(() => {
    setContext(initialContext);
    if (!startEmpty && selectedType === null) {
      setSelectedType(initialContext.current.type);
      setSelectionSource('documents');
    }
    setActiveSession(null);
  }, [initialContext, selectedType, startEmpty]);

  const chatEntries = useMemo(() => {
    if (!selectedType || !showHistoryForSelected) {
      if (selectedType && activeSession) {
        return activeSession.entries;
      }

      return [
        {
          kind: 'system' as const,
          id: !selectedType ? 'initial-empty' : 'selected-empty',
          text: !selectedType
            ? '先从左侧选择一个报告。选择后，你可以点击“开始复核”，也可以先输入更具体的审核要求。'
            : `已选择“${activeDocument?.label ?? context.current.label}”。你可以直接点击“开始复核”，或先在底部输入更具体的审核要求。`,
        },
      ];
    }
    return buildChatEntriesFromConversation(context.conversation, context.reviewRounds);
  }, [activeDocument, activeSession, context, selectedType, showHistoryForSelected]);

  const documentBlocks = useMemo(() => formatDocumentBlocks(context.draftBody), [context.draftBody]);
  const verificationEnabled = selectedType === 'credit' && context.verification.enabled;

  async function reloadContext(type = context.current.type) {
    const response = await fetch(`/api/ai-review/context?type=${type}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '上下文刷新失败');
    }
    setContext(data);
  }

  async function handleSelectDocument(type: ReviewDocumentType, options?: { showHistory?: boolean }) {
    setError(null);
    setNotice(null);
    setSelectedType(type);
    setSelectionSource(options?.showHistory ? 'history' : 'documents');
    setShowHistoryForSelected(Boolean(options?.showHistory));
    setActiveSession(null);
    setActiveTab('chat');
    await reloadContext(type);
    router.replace(`/ai-review?type=${type}`, { scroll: false });
  }

  async function deleteExperience(item: ExperienceItem) {
    if (!selectedType || deletingExperienceId) return;
    setDeletingExperienceId(item.id);
    setError(null);
    try {
      const response = await fetch('/api/ai-review/experience', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, id: item.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '删除沉淀经验失败');
      }
      await reloadContext(selectedType);
    } catch (deleteError) {
      setError((deleteError as Error).message);
    } finally {
      setDeletingExperienceId(null);
    }
  }

  function triggerExperienceFlight(items: ExperienceItem[]) {
    if (items.length === 0) return;
    const label = items.length === 1 ? `沉淀经验：${items[0].text}` : `沉淀经验 +${items.length}`;
    const id = `${items.map((item) => item.id).join('-')}-${Date.now()}`;
    setFlyingExperience({ id, label, phase: 'launch' });
    window.setTimeout(() => {
      setFlyingExperience((current) => (current?.id === id ? { ...current, phase: 'arrive' } : current));
    }, 30);
    window.setTimeout(() => {
      setFlyingExperience((current) => (current?.id === id ? null : current));
    }, 1200);
  }

  async function handleReview(message: string, action: 'start' | 'message') {
    setIsReviewing(true);
    setError(null);
    setNotice(null);
    setShowHistoryForSelected(false);
    try {
      const reviewType = selectedType ?? context.current.type;
      const response = await fetch('/api/ai-review/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reviewType, message, action }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'AI 复核失败');
      }
      await reloadContext(reviewType);
      setSelectionSource('documents');
      setActiveSession((current) => {
        const baseEntries = action === 'start' ? [] : current?.entries ?? [];
        const nextEntries = baseEntries.map((entry) =>
          entry.kind === 'review' ? { ...entry, isLatest: false } : entry,
        );
        nextEntries.push({ kind: 'user', id: `user-${Date.now()}`, text: message });
        if (data.kind === 'review' && data.round) {
          nextEntries.push({
            kind: 'review',
            id: `review-${data.round.id}`,
            round: data.round,
            isLatest: true,
            fromActiveSession: true,
          });
        } else if (data.reply) {
          nextEntries.push({ kind: 'assistant', id: `assistant-${Date.now()}`, text: data.reply });
        }
        return { entries: nextEntries };
      });
      if (Array.isArray(data.addedExperience) && data.addedExperience.length > 0) {
        triggerExperienceFlight(data.addedExperience);
      }
      setInput('');
      setActiveTab('chat');
      if (Array.isArray(data.addedExperience) && data.addedExperience.length > 0) {
        setNotice(`已新增 ${data.addedExperience.length} 条沉淀经验。`);
      } else if (data.kind === 'review') {
        setNotice('已完成本轮复核。');
      } else {
        setNotice('已完成本次问答。');
      }
      if (data.kind === 'chat') {
        window.setTimeout(() => scrollChatToBottom('smooth'), 40);
      }
    } catch (reviewError) {
      setError((reviewError as Error).message);
    } finally {
      setIsReviewing(false);
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/ai-review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: context.current.type }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '提交 OA 失败');
      }
      await reloadContext();
      setNotice(`已生成提交结论，流程：${data.flow.join(' / ')}`);
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="ml-48 min-h-screen bg-surface px-6 pb-28 pt-20">
      <section className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${statusTone(context.status)}`}>当前状态：{context.status}</span>
          <h1 className="mt-3 font-headline text-[2.2rem] font-black leading-none tracking-tight text-primary">AI 综合复核工作台</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !context.latestReview}
            className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            提交 OA
          </button>
        </div>
      </section>

      {(notice || error) && (
        <section className={`mb-5 rounded-2xl px-4 py-3 text-sm font-medium ${error ? 'bg-error-container text-on-error-container' : 'bg-tertiary-fixed-dim/15 text-on-tertiary-container'}`}>
          {error || notice}
        </section>
      )}

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 xl:col-span-3">
          <div className="rounded-3xl bg-surface-container-low p-4">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.18em] text-primary">可复核材料</h2>
            </div>
            <div className="space-y-3">
              {context.documents.map((document) => {
                const active = selectedType === document.type && selectionSource === 'documents';
                return (
                  <button
                    key={document.type}
                    type="button"
                    onClick={() => void handleSelectDocument(document.type)}
                    data-testid={`review-material-${document.type}`}
                    className={`block w-full rounded-2xl px-4 py-4 text-left transition ${
                      active
                        ? 'border-2 border-primary bg-primary-container text-white shadow-[0_18px_36px_rgba(11,28,48,0.12)]'
                        : 'border-2 border-transparent bg-white/55 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm font-black ${active ? 'text-white' : 'text-primary'}`}>{document.label}</p>
                        <p className={`mt-1 text-xs leading-5 ${active ? 'text-white/80' : 'text-on-surface-variant'}`}>{document.summary}</p>
                      </div>
                      <ChevronRight className={`mt-0.5 h-4 w-4 ${active ? 'text-white/80' : 'text-on-surface-variant'}`} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black ${active ? 'bg-white/15 text-white' : statusTone(document.reviewStatus)}`}>{formatReviewStatusLabel(document.reviewStatus)}</span>
                      {document.lastReviewedAt ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${active ? 'bg-white/15 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                          <Clock3 className="h-3 w-3" />
                          {document.lastReviewedAt}
                        </span>
                      ) : (
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black ${active ? 'bg-white/15 text-white' : 'bg-surface-container text-on-surface-variant'}`}>未复核</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-[0.18em] text-primary">历史记录</h3>
              </div>
              <div className="space-y-2">
                {context.documents
                  .filter((document) => document.lastReviewedAt)
                  .map((document) => {
                    const active = selectedType === document.type && selectionSource === 'history';
                    return (
                      <button
                        key={`history-${document.type}`}
                        type="button"
                        onClick={() => void handleSelectDocument(document.type, { showHistory: true })}
                        data-testid={`review-history-${document.type}`}
                        className={`block w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                          active
                            ? 'border-2 border-primary bg-primary-container text-white shadow-[0_18px_36px_rgba(11,28,48,0.12)]'
                            : 'border-2 border-transparent bg-white hover:bg-surface-container-low'
                        }`}
                      >
                        <p className={`font-bold ${active ? 'text-white' : 'text-primary'}`}>{document.label}</p>
                        <p className={`mt-1 text-xs ${active ? 'text-white/80' : 'text-on-surface-variant'}`}>
                          {document.lastReviewedAt} / {formatReviewStatusLabel(document.reviewStatus)}
                        </p>
                      </button>
                    );
                  })}
                {context.documents.every((document) => !document.lastReviewedAt) ? (
                  <div className="rounded-2xl bg-white px-4 py-4 text-sm text-on-surface-variant">当前还没有历史复核记录。</div>
                ) : null}
              </div>
            </div>
          </div>
        </aside>

        <section className="col-span-12 xl:col-span-6">
          <div className="flex min-h-[42rem] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_20px_40px_rgba(11,28,48,0.06)]">
            <div className="border-b border-outline-variant/15 bg-surface-container-low px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary">当前材料</p>
                  <h2 data-testid="current-material-title" className="mt-1 text-lg font-black text-primary">{selectedType ? (activeDocument?.label ?? context.current.label) : '未选择材料'}</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">{selectedType ? (activeDocument?.modeLabel ?? context.modeLabel) : '请先在左侧选择一个可复核报告'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className={`rounded-full px-3 py-1.5 text-xs font-black ${activeTab === 'chat' ? 'bg-primary text-white' : 'bg-white text-primary'}`}
                  >
                    AI 审核意见
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('document')}
                    className={`rounded-full px-3 py-1.5 text-xs font-black ${activeTab === 'document' ? 'bg-primary text-white' : 'bg-white text-primary'}`}
                  >
                    文档内容
                  </button>
                  {verificationEnabled ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab('verification')}
                      className={`rounded-full px-3 py-1.5 text-xs font-black ${activeTab === 'verification' ? 'bg-primary text-white' : 'bg-white text-primary'}`}
                    >
                      数据核验
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div ref={chatScrollRef} className="flex-1 overflow-y-auto bg-surface-container-low/45 p-5">
              {activeTab === 'verification' ? (
                verificationEnabled ? (
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <PanelRightOpen className="h-4 w-4 text-secondary" />
                      <h3 className="text-sm font-black text-primary">授信报告数据核验</h3>
                    </div>
                    {context.verification.traceItems.length > 0 ? (
                      <div className="overflow-hidden rounded-2xl border border-outline-variant/15">
                        <div className="grid grid-cols-[1.5fr_0.7fr_2.8fr] gap-0 border-b border-outline-variant/15 bg-surface-container-low text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">
                          <div className="px-4 py-3">数字项</div>
                          <div className="px-4 py-3">类型</div>
                          <div className="px-4 py-3">来源说明</div>
                        </div>
                        <div className="max-h-[36rem] overflow-y-auto">
                          {context.verification.traceItems.map((item) => (
                            <div key={item.id} className="grid grid-cols-[1.5fr_0.7fr_2.8fr] gap-0 border-b border-outline-variant/10 bg-white text-sm last:border-b-0">
                              <div className="px-4 py-4">
                                <p className="font-black text-primary">{item.semanticLabel}</p>
                                <p className="mt-1 text-xs font-bold text-secondary">{item.numberText}</p>
                              </div>
                              <div className="px-4 py-4 text-on-surface">
                                {item.sourceType === 'direct' ? '直接取数' : '计算得出'}
                              </div>
                              <div className="px-4 py-4 leading-6 text-on-surface">
                                {item.sourceSummary}
                                {item.note ? <p className="mt-1 text-xs text-on-surface-variant">备注：{item.note}</p> : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-outline-variant/20 bg-surface-container-low px-5 py-5 text-sm leading-6 text-on-surface-variant">
                        当前授信报告尚未生成数据核验映射。请先在授信报告预览页生成一次最新报告，或稍后刷新后再查看。
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-3xl bg-white p-8 text-center text-sm leading-6 text-on-surface-variant shadow-sm">
                    当前所选材料暂未启用数据核验视图。
                  </div>
                )
              ) : activeTab === 'document' && selectedType ? (
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <PanelRightOpen className="h-4 w-4 text-secondary" />
                    <h3 className="text-sm font-black text-primary">当前文档内容</h3>
                  </div>
                  <div className="space-y-4">
                    {documentBlocks.map((block) => (
                      <section
                        key={block.id}
                        className={block.isTitle ? 'rounded-2xl bg-surface-container-low px-5 py-5 text-center' : block.isSection ? 'rounded-2xl bg-surface-container-low px-5 py-4' : ''}
                      >
                        <p
                          className={
                            block.isTitle
                              ? 'text-lg font-black leading-8 text-primary'
                              : block.isSection
                                ? 'text-sm font-black leading-7 text-primary'
                                : 'text-sm leading-7 text-on-surface'
                          }
                        >
                          {block.text}
                        </p>
                      </section>
                    ))}
                  </div>
                </div>
              ) : activeTab === 'document' ? (
                <div className="rounded-3xl bg-white p-8 text-center text-sm leading-6 text-on-surface-variant shadow-sm">
                  请选择一个材料后再查看文档内容。
                </div>
              ) : (
                <div className="space-y-4">
                  {chatEntries.map((entry) => {
                    if (entry.kind === 'system') {
                      return (
                        <div key={entry.id} className="flex">
                          <div className="max-w-[85%] rounded-3xl bg-white px-5 py-4 text-sm leading-6 text-on-surface shadow-sm">
                            {entry.text}
                          </div>
                        </div>
                      );
                    }

                    if (entry.kind === 'user') {
                      return (
                        <div key={entry.id} className="flex justify-end">
                          <div className="max-w-[80%] rounded-3xl bg-primary px-5 py-4 text-sm leading-6 text-white shadow-sm">
                            {entry.text}
                          </div>
                        </div>
                      );
                    }

                    if (entry.kind === 'assistant') {
                      return (
                        <div key={entry.id} className="flex">
                          <div className="max-w-[85%] rounded-3xl bg-white px-5 py-4 text-sm leading-6 text-on-surface shadow-sm">
                            {entry.text}
                          </div>
                        </div>
                      );
                    }

                    if (entry.isLatest) {
                      return (
                        <ReviewCard
                          key={`${entry.id}-${entry.round.review.summary}-${shouldAnimateCurrentConversation ? 'animated' : 'static'}`}
                          round={entry.round}
                          isLatest={entry.isLatest}
                          animate={shouldAnimateCurrentConversation && entry.fromActiveSession}
                          onProgress={() => scrollChatToBottom()}
                        />
                      );
                    }

                    return (
                      <details key={entry.id} className="rounded-3xl bg-white p-5 shadow-sm">
                        <summary className="cursor-pointer text-sm font-black text-primary">第 {entry.round.index} 轮复核</summary>
                        <div className="mt-4">
                          <ReviewCard round={entry.round} isLatest={false} />
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="col-span-12 xl:col-span-3">
          <div className="space-y-4">
            <section className="rounded-3xl bg-surface-container-low p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                    {activeTab === 'verification' && verificationEnabled ? '系统预置核数要点' : '系统预置要点'}
                  </h2>
                </div>
                <button type="button" className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-primary shadow-sm">
                  <Edit3 className="h-3 w-3" />
                  修改要点
                </button>
              </div>
              <div className="space-y-3">
                {(activeTab === 'verification' && verificationEnabled ? context.verification.presetPoints : context.presetPoints).map((item, index) => (
                  <div key={item} className="rounded-2xl border-l-4 border-primary bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold leading-6 text-on-surface">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-tertiary-container px-4 py-4 text-white shadow-[0_20px_40px_rgba(11,28,48,0.12)]">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-tertiary-fixed-dim" />
                <h2 className="text-xs font-black uppercase tracking-[0.18em] text-tertiary-fixed-dim">沉淀经验</h2>
              </div>
              <div className="space-y-3">
                {context.learnedExperience.length > 0 ? context.learnedExperience.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm leading-6">
                    <div className="flex items-start gap-3">
                      <p className="flex-1">{item.text}</p>
                      <button
                        type="button"
                        onClick={() => void deleteExperience(item)}
                        disabled={deletingExperienceId === item.id}
                        className="rounded-full border border-white/15 p-1 text-white/80 transition hover:bg-white/10 disabled:opacity-40"
                        aria-label="删除沉淀经验"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm leading-6 text-white/80">
                    当前还没有累计沉淀经验。
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-secondary" />
                <h2 className="text-xs font-black uppercase tracking-[0.18em] text-secondary">本次新增要点</h2>
              </div>
              <div className="space-y-3">
                {context.latestAddedExperience.length > 0 ? context.latestAddedExperience.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-secondary/5 px-4 py-3 text-sm leading-6 text-on-surface">
                    {item.text}
                  </div>
                )) : null}
              </div>
            </section>
          </div>
        </aside>
      </div>

      {flyingExperience ? (
        <div
          className="pointer-events-none fixed z-30"
          style={{
            left: flyingExperience.phase === 'launch' ? '52%' : '86%',
            top: flyingExperience.phase === 'launch' ? '78%' : '24%',
            transform: flyingExperience.phase === 'launch' ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.82)',
            opacity: flyingExperience.phase === 'launch' ? 1 : 0.15,
            transition: 'all 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-black text-white shadow-[0_20px_40px_rgba(11,28,48,0.24)]">
            <ArrowRight className="h-3.5 w-3.5" />
            {flyingExperience.label}
          </div>
        </div>
      ) : null}

      <footer className="fixed bottom-0 right-0 left-48 z-20 border-t border-outline-variant/15 bg-white/96 px-6 py-4 backdrop-blur-md">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-tertiary-fixed-dim text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-black text-primary">{selectedType ? (activeDocument?.label ?? context.current.label) : '未选择材料'}</p>
              <p className="text-xs text-on-surface-variant">{selectedType ? '输入复核要求，或直接开始按系统要点复核' : '先在左侧选择一个可复核报告'}</p>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-3 rounded-full bg-surface-container-low px-4 py-2.5">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  const message = input.trim();
                  if (message && !isReviewing) {
                    void handleReview(message, 'message');
                  }
                }
              }}
              className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/70"
              placeholder={selectedType ? `例如：请审核这份${activeDocument?.label ?? context.current.label}；或“请把以下两条记为审核要点，并重新审核”。` : '请先在左侧选择一个可复核报告'}
              disabled={!selectedType}
            />
            <button
              type="button"
              onClick={() => {
                const message = input.trim();
                if (message && !isReviewing) {
                  void handleReview(message, 'message');
                }
              }}
              disabled={!selectedType || !input.trim() || isReviewing}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="发送复核反馈"
            >
              {isReviewing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleReview(`请审核这份${activeDocument?.label ?? context.current.label}，按当前系统预置要点给出审核意见。`, 'start')}
            disabled={isReviewing || !selectedType}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isReviewing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            开始复核
          </button>
        </div>
      </footer>
    </main>
  );
}
