import Link from 'next/link';
import { BookOpenText, Sparkles } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CreditPolicyDrawer from '@/components/credit/CreditPolicyDrawer';
import PendingApprovalsCard from '@/components/credit/PendingApprovalsCard';
import PolicyTopicButton from '@/components/credit/PolicyTopicButton';
import { getCreditReportData } from '@/lib/server/credit-report';

export const dynamic = 'force-dynamic';

const groupAccent: Record<string, string> = {
  application: 'border-blue-600 text-blue-700',
  policy_target: 'border-secondary text-secondary',
  measured: 'border-tertiary-fixed-dim text-on-tertiary-container',
  new_org: 'border-outline-variant text-primary',
};

export default async function CreditAnalysisPage() {
  const data = await getCreditReportData();

  return (
    <>
      <Sidebar />
      <Header />
      <CreditPolicyDrawer topics={data.policyTopics} defaultOpen defaultTopic="credit_strategy" />

      <main className="ml-48 h-[calc(100vh-4rem)] overflow-y-auto bg-surface p-10 pt-24">
        <div className="mb-10 flex items-end justify-between gap-8 pr-[24rem]">
          <div>
            <h1 className="font-headline text-4xl font-black tracking-tight text-primary">AI 授信结论归纳</h1>
            <div className="mt-3 flex items-center gap-3">
              <span className="rounded-full bg-tertiary-fixed-dim/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-tertiary-fixed">Active Analysis</span>
              <span className="text-sm text-on-surface-variant">Session ID: AI-2025-0882-CN</span>
            </div>
          </div>
          <Link href="/credit-report/report" className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(11,28,48,0.16)]">
            确认生成报告
            <Sparkles className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-12 gap-8 pr-[24rem]">
          <section className="col-span-4 space-y-4">
            <h2 className="px-1 text-sm font-black uppercase tracking-[0.18em] text-on-surface-variant">机构分组逻辑</h2>
            {data.groups.map((group) => (
              <Link key={group.key} href={`/credit-report/detail/${group.key}`} className={`block rounded-3xl border-l-4 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 ${groupAccent[group.key]}`}>
                <div className="mb-3 flex items-start justify-between">
                  <span className="text-xs font-black">{group.title}</span>
                  <span className="text-2xl font-black text-primary">{String(group.count).padStart(2, '0')} <span className="text-xs font-medium text-on-surface-variant">家</span></span>
                </div>
                <p className="text-[11px] leading-5 text-on-surface-variant">{group.summary}</p>
              </Link>
            ))}
          </section>

          <section className="col-span-8 flex flex-col gap-6">
            <div className="relative overflow-hidden rounded-3xl border border-tertiary-fixed-dim/25 bg-white p-8">
              <div className="absolute -right-10 -top-10 text-slate-100">
                <Sparkles className="h-36 w-36" />
              </div>
              <div className="mb-4 flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-on-tertiary-container" />
                <span className="text-xs font-black uppercase tracking-[0.18em] text-on-tertiary-container">AI Insight Summary</span>
              </div>
              <p className="max-w-3xl font-headline text-[2rem] font-black leading-tight text-primary">{data.summary.oneLiner}</p>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <h2 className="mb-8 text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">金额汇总</h2>
              <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                <div>
                  <p className="text-[10px] uppercase text-on-surface-variant">Total Allocated</p>
                  <p className="font-headline text-5xl font-black text-primary">¥ {data.stats.grantedTotal.toFixed(1)} <span className="text-sm font-semibold text-on-surface-variant">Cr</span></p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-on-surface-variant">Growth YoY</p>
                  <p className="font-headline text-5xl font-black text-secondary">+12.4 <span className="text-sm font-semibold text-on-surface-variant">%</span></p>
                </div>
                <div className="col-span-2 h-px bg-surface-container" />
                {data.groups.map((group) => (
                  <div key={group.key} className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">{group.title}</span>
                      <span className="font-bold">¥ {group.totalCredit.toFixed(1)} Cr</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-low">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(group.totalCredit / data.stats.grantedTotal) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <PendingApprovalsCard items={data.pendingItems} />

            <div className="grid grid-cols-2 gap-4">
              {data.summary.executionNotes.map((note, index) => (
                <PolicyTopicButton
                  key={note}
                  topic={index === 0 ? 'risk_split' : 'approval_workflow'}
                  className="rounded-3xl bg-surface-container-low px-5 py-5 text-left text-sm font-semibold leading-6 text-on-surface transition hover:bg-surface-container-highest"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <BookOpenText className="h-4 w-4 text-on-tertiary-container" />
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-on-tertiary-container">制度助手联动</span>
                  </div>
                  {note}
                </PolicyTopicButton>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
