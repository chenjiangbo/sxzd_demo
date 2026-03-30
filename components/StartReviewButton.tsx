'use client';

import { Sparkles } from 'lucide-react';
import StepTransitionButton from '@/components/StepTransitionButton';

export default function StartReviewButton() {
  return (
    <div className="inline-flex">
      <StepTransitionButton
        href="/cases/workbench?step=overview"
        label="开始审查"
        stepKey="overview"
        icon={<Sparkles className="h-4 w-4" />}
        className="min-w-[136px] justify-center px-5 py-2 text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
      />
    </div>
  );
}
