'use client';

import { useState } from 'react';
import type { CreditGroupKey } from '@/lib/server/credit-report';

const options = ['按申请额度配置', '按政策目标值配置', '按测算值配置', '新机构按政策目标值配置'];

type Props = {
  groupKey: CreditGroupKey;
  currentLabel: string;
  currentRemark: string;
};

export default function GroupTagEditor({ groupKey, currentLabel, currentRemark }: Props) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(currentLabel);
  const [remark, setRemark] = useState(currentRemark);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const response = await fetch('/api/credit-report/overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'group', groupKey, label, remark }),
    });
    setSaving(false);
    if (!response.ok) {
      throw new Error('Failed to save group override');
    }
    setOpen(false);
    window.location.reload();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-surface-container-highest px-4 py-3 text-sm font-black text-secondary transition hover:bg-secondary hover:text-white"
      >
        修改口径标签
      </button>
      {!open ? null : (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-[0_24px_50px_rgba(11,28,48,0.18)]">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">配置口径确认</p>
              <h3 className="mt-1 text-xl font-black text-primary">修改展示标签与备注</h3>
            </div>
            <div className="space-y-3">
              {options.map((option) => (
                <label key={option} className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface">
                  <input type="radio" name="group-label" checked={label === option} onChange={() => setLabel(option)} className="h-4 w-4 border-outline-variant text-primary focus:ring-primary/20" />
                  {option}
                </label>
              ))}
            </div>
            <textarea
              className="mt-4 min-h-28 w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-secondary"
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              placeholder="填写补充说明，例如“按历史口径确认”或“需业务负责人复核”。"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-bold text-on-surface-variant">
                取消
              </button>
              <button type="button" onClick={submit} disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                {saving ? '保存中...' : '确认保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
