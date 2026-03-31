'use client';

import type { ReactNode } from 'react';

export const CREDIT_POLICY_OPEN_EVENT = 'credit-policy-open';

type Props = {
  topic: string;
  className?: string;
  children: ReactNode;
};

export default function PolicyTopicButton({ topic, className, children }: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        window.dispatchEvent(new CustomEvent(CREDIT_POLICY_OPEN_EVENT, { detail: { topic } }));
      }}
    >
      {children}
    </button>
  );
}
