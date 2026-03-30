'use client';

import { useRouter } from 'next/navigation';

type Props = {
  href: string;
  label: string;
  primary?: boolean;
};

export default function StepNavButton({ href, label, primary = false }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={
        primary
          ? 'inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-lg shadow-primary/15 transition-all hover:scale-[1.01] hover:bg-primary/90'
          : 'rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50'
      }
    >
      {label}
    </button>
  );
}
