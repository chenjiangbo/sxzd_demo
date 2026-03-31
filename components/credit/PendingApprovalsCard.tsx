'use client';

import { useState } from 'react';
import type { CreditReportData } from '@/lib/server/credit-report';

type Props = {
  items: CreditReportData['pendingItems'];
  compact?: boolean;
};

export default function PendingApprovalsCard({ items, compact = false }: Props) {
  const [state, setState] = useState(items);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function save(itemId: string, payload: { checked?: boolean; remark?: string }) {
    setSavingId(itemId);
    const response = await fetch('/api/credit-report/overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'pending', itemId, ...payload }),
    });
    if (!response.ok) {
      setSavingId(null);
      throw new Error('Failed to save pending item');
    }
    setSavingId(null);
  }

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">待确认事项</p>
          <h3 className="mt-1 text-lg font-black text-primary">人工确认面板</h3>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-secondary">{state.filter((item) => item.checked).length}/{state.length} 已确认</span>
      </div>

      <div className="space-y-3">
        {state.map((item) => (
          <div key={item.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={async (event) => {
                  const checked = event.target.checked;
                  setState((current) => current.map((entry) => (entry.id === item.id ? { ...entry, checked } : entry)));
                  await save(item.id, { checked });
                }}
                className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-primary">{item.title}</p>
                  {savingId === item.id ? <span className="text-[10px] font-bold text-on-surface-variant">保存中...</span> : null}
                </div>
                <p className="mt-1 text-xs leading-5 text-on-surface-variant">{item.description}</p>
                {!compact ? <p className="mt-2 text-[11px] font-medium text-secondary">{item.impact}</p> : null}
              </div>
            </label>
            {!compact ? (
              <textarea
                className="mt-3 min-h-20 w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-xs outline-none focus:border-secondary"
                placeholder="填写人工备注"
                value={item.remark}
                onChange={(event) => {
                  const remark = event.target.value;
                  setState((current) => current.map((entry) => (entry.id === item.id ? { ...entry, remark } : entry)));
                }}
                onBlur={async (event) => {
                  await save(item.id, { remark: event.target.value });
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
