'use client';

import { Send } from 'lucide-react';
import { useState } from 'react';

type Props = {
  defaultMemo: string;
  variant?: 'primary' | 'secondary';
};

export default function SubmitOaButton({ defaultMemo, variant = 'primary' }: Props) {
  const [open, setOpen] = useState(false);
  const [memo, setMemo] = useState(defaultMemo);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ referenceNo: string; submittedAt: string } | null>(null);

  async function submit() {
    setSubmitting(true);
    const response = await fetch('/api/credit-report/submit-oa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memo }),
    });
    const payload = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      throw new Error(payload?.error ?? 'Failed to submit OA');
    }
    setResult({ referenceNo: payload.referenceNo, submittedAt: payload.submittedAt });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === 'primary'
            ? 'flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-white shadow-[0_16px_28px_rgba(11,28,48,0.14)]'
            : 'flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-white px-5 py-3 text-sm font-black text-primary'
        }
      >
        <Send className="h-4 w-4" />
        提交 OA
      </button>
      {!open ? null : (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-[0_26px_52px_rgba(11,28,48,0.18)]">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">OA 提交</p>
              <h3 className="mt-1 text-xl font-black text-primary">生成提交包并写入本地记录</h3>
            </div>
            {result ? (
              <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-sm font-bold text-primary">提交成功</p>
                <p className="mt-2 text-xs text-on-surface-variant">流水号：{result.referenceNo}</p>
                <p className="mt-1 text-xs text-on-surface-variant">提交时间：{new Date(result.submittedAt).toLocaleString('zh-CN')}</p>
              </div>
            ) : (
              <>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-secondary"
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                />
                <p className="mt-3 text-xs leading-5 text-on-surface-variant">提交后会生成本地 OA JSON 提交包，并记录参考流水号，供后续接 OA 时直接映射。</p>
              </>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-bold text-on-surface-variant">
                关闭
              </button>
              {!result ? (
                <button type="button" onClick={submit} disabled={submitting} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                  {submitting ? '提交中...' : '确认提交'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
