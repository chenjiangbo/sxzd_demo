'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, LoaderCircle, Save } from 'lucide-react';

type Props = {
  step?: string;
  compact?: boolean;
};

export default function SaveSnapshotButton({ step = 'overview', compact = false }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          setSaved(false);
          const response = await fetch('/api/save-snapshot', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ caseId: 'baoji-sanjiacun', step }),
          });

          if (!response.ok) {
            throw new Error(`Save snapshot failed with status ${response.status}`);
          }

          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        });
      }}
      disabled={isPending}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-colors disabled:cursor-wait disabled:opacity-80 ${
        compact
          ? 'px-3 py-2 text-sm'
          : 'px-4 py-2 text-sm'
      } ${saved ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-container' : 'bg-primary text-white hover:bg-primary/90'}`}
    >
      {isPending ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" />
          正在保存...
        </>
      ) : saved ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          已保存
        </>
      ) : (
        <>
          <Save className="h-4 w-4" />
          保存草稿
        </>
      )}
    </button>
  );
}
