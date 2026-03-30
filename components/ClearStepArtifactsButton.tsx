'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Eraser, LoaderCircle } from 'lucide-react';

type Props = {
  step?: string;
  compact?: boolean;
  iconOnly?: boolean;
};

export default function ClearStepArtifactsButton({ step = 'overview', compact = false, iconOnly = false }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cleared, setCleared] = useState(false);
  const isBusy = isPending;

  return (
    <button
      type="button"
      onClick={async () => {
        setCleared(false);
        const response = await fetch('/api/clear-step-artifacts', {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error(`Clear step artifacts failed with status ${response.status}`);
        }

        setCleared(true);
        startTransition(() => {
          router.push(`/cases/workbench?step=${step}`);
          router.refresh();
        });
      }}
      disabled={isBusy}
      title="清空步骤结果"
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-80 ${
        iconOnly ? 'h-10 w-10' : compact ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-sm'
      }`}
    >
      {isBusy ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" />
          {!iconOnly ? '正在清空...' : null}
        </>
      ) : (
        <>
          <Eraser className="h-4 w-4" />
          {!iconOnly ? (cleared ? '已清空步骤结果' : '清空步骤结果') : null}
        </>
      )}
    </button>
  );
}
