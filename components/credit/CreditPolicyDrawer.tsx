'use client';

import { BookOpenText, LoaderCircle, MessageSquareText, Send, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { CreditPolicyTopicKey, CreditReportData } from '@/lib/server/credit-report';
import { cn } from '@/lib/utils';
import { CREDIT_POLICY_OPEN_EVENT } from '@/components/credit/PolicyTopicButton';

type Props = {
  topics: CreditReportData['policyTopics'];
  defaultTopic?: CreditPolicyTopicKey;
  defaultOpen?: boolean;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

const TOPIC_QUESTION_MAP: Record<CreditPolicyTopicKey, string> = {
  credit_formula: '授信额度是怎么测算出来的？',
  eight_metrics: '8 项指标分别是什么，怎么影响额度系数？',
  rating_factor: '评级 A/B/C 是怎么换算到授信额度里的？',
  risk_split: '非分险和分险额度分别怎么确定？',
  submission_materials: '授信资料一般需要准备哪些？',
  approval_workflow: '授信审批流程是怎么走的？',
  credit_strategy: '为什么不是所有机构都按测算值授信？',
};

function renderInlineMarkdown(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return tokens.map((token, index) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={`${token}-${index}`} className="font-black text-primary">
          {token.slice(2, -2)}
        </strong>
      );
    }

    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={`${token}-${index}`} className="rounded bg-surface-container-low px-1.5 py-0.5 text-[12px] font-bold text-secondary">
          {token.slice(1, -1)}
        </code>
      );
    }

    return <span key={`${token}-${index}`}>{token}</span>;
  });
}

function MarkdownMessage({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: Array<
    | { type: 'paragraph'; text: string }
    | { type: 'ol'; items: string[] }
    | { type: 'ul'; items: string[] }
  > = [];

  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next || /^\d+\.\s+/.test(next) || /^[-*]\s+/.test(next)) break;
      paragraphLines.push(next);
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, blockIndex) => {
        if (block.type === 'paragraph') {
          return (
            <p key={`p-${blockIndex}`} className="leading-7">
              {renderInlineMarkdown(block.text)}
            </p>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={`ol-${blockIndex}`} className="list-decimal space-y-2 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={`ol-item-${blockIndex}-${itemIndex}`} className="leading-7">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <ul key={`ul-${blockIndex}`} className="list-disc space-y-2 pl-5">
            {block.items.map((item, itemIndex) => (
              <li key={`ul-item-${blockIndex}-${itemIndex}`} className="leading-7">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

export default function CreditPolicyDrawer({ topics, defaultTopic = 'credit_formula', defaultOpen = false }: Props) {
  const topicKeys = Object.keys(topics) as CreditPolicyTopicKey[];
  const [open, setOpen] = useState(defaultOpen);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: '可以直接问我制度条文、统计表字段、授信配置口径和审批流程，我会基于制度和统计表来回答。',
    },
  ]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const shortcuts = useMemo(
    () =>
      topicKeys.map((key) => ({
        key,
        title: topics[key].title,
        question: TOPIC_QUESTION_MAP[key],
      })),
    [topicKeys, topics],
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ topic?: CreditPolicyTopicKey }>).detail;
      if (detail?.topic && TOPIC_QUESTION_MAP[detail.topic]) {
        setInput(TOPIC_QUESTION_MAP[detail.topic]);
      }
      setOpen(true);
    };
    window.addEventListener(CREDIT_POLICY_OPEN_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(CREDIT_POLICY_OPEN_EVENT, handler as EventListener);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setOpen(true);
    setLoading(true);
    setInput('');
    setMessages((current) => [...current, { id: `${Date.now()}-user`, role: 'user', text: trimmed }]);

    try {
      const response = await fetch('/api/credit-report/policy-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? '制度助手回答失败。');
      }

      setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: 'assistant', text: payload.answer }]);
    } catch (error) {
      setMessages((current) => [...current, { id: `${Date.now()}-assistant-error`, role: 'assistant', text: (error as Error).message || '制度助手回答失败。' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside
      className={cn(
        'fixed right-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-[26rem] max-w-[96vw] border-l border-slate-100 bg-white/95 shadow-[-22px_0_44px_rgba(11,28,48,0.08)] backdrop-blur-md transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full',
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-tertiary-fixed-dim/20 text-on-tertiary-container">
              <BookOpenText className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-black text-primary">制度助手</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Policy Q&A</p>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 text-on-surface-variant transition hover:bg-surface-container-low">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">快捷提问</p>
          <div className="mt-3 -mx-1 overflow-x-auto pb-1">
            <div className="flex min-w-max items-center gap-2 px-1">
              {shortcuts.map((shortcut) => (
                <button
                  key={shortcut.key}
                  type="button"
                  onClick={() => void ask(shortcut.question)}
                  disabled={loading}
                  className="shrink-0 rounded-full bg-surface-container-low px-3 py-1.5 text-[11px] font-bold whitespace-nowrap text-primary transition hover:bg-surface-container disabled:opacity-60"
                >
                  {shortcut.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-surface-container-low/40 px-5 py-5">
          {messages.map((message) => (
            <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm',
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'border border-slate-100 bg-white text-on-surface',
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  <MessageSquareText className="h-3.5 w-3.5 opacity-70" />
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                    {message.role === 'user' ? '提问' : '制度助手'}
                  </span>
                </div>
                {message.role === 'assistant' ? <MarkdownMessage text={message.text} /> : <p className="whitespace-pre-wrap">{message.text}</p>}
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-on-surface shadow-sm">
                <div className="flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin text-secondary" />
                  <span>正在检索制度和统计表并生成回答...</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-100 p-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void ask(input);
            }}
            className="rounded-3xl border border-outline-variant/20 bg-white p-3 shadow-sm"
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={3}
              placeholder="请输入关于制度、统计表字段、授信测算或审批流程的问题"
              className="w-full resize-none border-none bg-transparent px-2 py-1 text-sm leading-6 text-on-surface outline-none"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-on-surface-variant">问题会基于制度文本、统计表和授信样稿进行回答。</p>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-black text-white disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                发送
              </button>
            </div>
          </form>
        </div>
      </div>
    </aside>
  );
}
