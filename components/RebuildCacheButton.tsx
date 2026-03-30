'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { LoaderCircle, RefreshCw } from 'lucide-react';

type Props = {
  step?: string;
  compact?: boolean;
  iconOnly?: boolean;
};

export default function RebuildCacheButton({ step = 'overview', compact = false, iconOnly = false }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRebuilding, setIsRebuilding] = useState(false);
  const isBusy = isPending || isRebuilding;

  return (
    <button
      type="button"
      onClick={async () => {
        setIsRebuilding(true);
        try {
          const response = await fetch('/api/rebuild-cache', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ caseId: 'baoji-sanjiacun' }),
          });

          if (!response.ok) {
            throw new Error(`Rebuild failed with status ${response.status}`);
          }

          startTransition(() => {
            router.push(`/cases/workbench?step=${step}&refresh=1`);
          });
        } finally {
          setIsRebuilding(false);
        }
      }}
      disabled={isBusy}
      title="重新生成缓存"
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-80 ${
        iconOnly ? 'h-10 w-10' : compact ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-sm'
      }`}
    >
      {isBusy ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" />
          {!iconOnly ? '正在重建缓存...' : null}
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          {!iconOnly ? '重新生成缓存' : null}
        </>
      )}
    </button>
  );
}
