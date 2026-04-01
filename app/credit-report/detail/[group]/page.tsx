import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Edit3, Sparkles } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CreditPolicyDrawer from '@/components/credit/CreditPolicyDrawer';
import GroupTagEditor from '@/components/credit/GroupTagEditor';
import PolicyTopicButton from '@/components/credit/PolicyTopicButton';
import { getCreditReportData, type CreditGroupKey } from '@/lib/server/credit-report';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ group: CreditGroupKey }>;
};

function formatCompRate(value: string | number) {
  if (typeof value === 'string') return value;
  return `${(value * 100).toFixed(2)}%`;
}

export default async function CreditDetailPage({ params }: Props) {
  const { group } = await params;
  const data = await getCreditReportData();
  const groupData = data.groups.find((item) => item.key === group);
  if (!groupData) notFound();

  const avgFactor = groupData.members.reduce((sum, item) => sum + item.factor, 0) / groupData.members.length;
  const avgComp = groupData.members.reduce((sum, item) => sum + (typeof item.compensationRate === 'number' ? item.compensationRate : 0), 0) / groupData.members.length;

  return (
    <>
      <Sidebar />
      <Header />
      <CreditPolicyDrawer topics={data.policyTopics} />

      <main className="ml-48 min-h-screen bg-surface px-10 pb-12 pt-24">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-xs text-on-surface-variant">
              <Link href="/credit-report" className="hover:text-primary">授信报告</Link>
              <span>/</span>
              <span className="font-semibold text-primary">授信结论详情</span>
            </nav>
            <h1 className="font-headline text-4xl font-black tracking-tight text-primary">{groupData.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">{groupData.summary}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/api/credit-report/export-report" className="rounded-xl border border-outline-variant/20 bg-white px-5 py-3 text-sm font-black text-primary transition hover:bg-surface-container-low">
              导出报告
            </Link>
            <Link href="/credit-report/report" className="rounded-xl bg-primary px-5 py-3 text-sm font-black text-white">
              确认全部结论
            </Link>
          </div>
        </div>

        <div className="mb-10 flex items-center justify-between rounded-3xl border border-tertiary-fixed-dim/25 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container text-tertiary-fixed-dim">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-black text-on-tertiary-container">AI 智能辅助提示</h2>
              <p className="text-xs text-on-surface-variant">{groupData.decisionBasis}</p>
            </div>
          </div>
          <PolicyTopicButton topic={groupData.policyTopic} className="text-xs font-black text-on-tertiary-container underline decoration-tertiary-fixed-dim/40 underline-offset-4">
            查看测算模型逻辑
          </PolicyTopicButton>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 rounded-3xl bg-white p-8 shadow-sm lg:col-span-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-lg font-black text-primary">配置口径确认</h2>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low text-secondary">
                <Edit3 className="h-4 w-4" />
              </span>
            </div>
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">当前配置模式</label>
                <div className="rounded-xl border-l-4 border-secondary bg-surface-container-low px-4 py-3">
                  <span className="text-sm font-black text-primary">{groupData.title}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">机构数量</label>
                  <p className="text-base font-black text-primary">{groupData.count} 家</p>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">总授信额度</label>
                  <p className="text-base font-black text-primary">{groupData.totalCredit.toFixed(1)} 亿元</p>
                </div>
              </div>
              <div className="rounded-2xl bg-surface-container-low px-4 py-4 text-xs leading-6 text-on-surface-variant">
                {groupData.members[0]?.remark || '注：仅可修改展示标签与备注，数值模型保持锁定。'}
              </div>
              <GroupTagEditor groupKey={groupData.key} currentLabel={groupData.title} currentRemark={groupData.members[0]?.remark ?? ''} />
            </div>
          </div>

          <div className="col-span-12 space-y-6 lg:col-span-8">
            <div className="flex items-center justify-between px-2">
              <div>
                <h2 className="text-lg font-black italic text-primary">机构列表与测算依据 <span className="ml-2 text-sm font-normal text-slate-400">（共 {groupData.count} 家）</span></h2>
              </div>
              <Link href="/credit-report/analysis" className="rounded-full bg-surface-container-low px-4 py-2 text-xs font-black text-primary">
                <ChevronLeft className="mr-1 inline h-3.5 w-3.5" />
                返回归纳页
              </Link>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <table className="w-full border-collapse text-left">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">机构名称</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">评价等级</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant text-right">2024规模</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant text-right">建议额度</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant text-center">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {groupData.members.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-primary">{item.name}</span>
                          <span className="text-[10px] text-slate-400">ID: {item.id.toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="rounded bg-primary px-2 py-1 text-[10px] font-black text-white">{item.rating}</span>
                      </td>
                      <td className="px-6 py-5 text-right font-mono text-sm text-primary">{item.scale2024.toFixed(2)}</td>
                      <td className="px-6 py-5 text-right font-mono text-sm font-black text-secondary">{item.totalCredit.toFixed(2)}</td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-tertiary-fixed-dim" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
              <div className="rounded-3xl border-b-4 border-primary bg-surface-container-low px-5 py-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">本组总授信额度</p>
                <p className="mt-3 text-4xl font-black text-primary">{groupData.totalCredit.toFixed(1)} <span className="text-sm font-semibold text-on-surface-variant">亿元</span></p>
              </div>
              <div className="rounded-3xl border-b-4 border-secondary bg-surface-container-low px-5 py-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">平均额度系数</p>
                <p className="mt-3 text-4xl font-black text-primary">{avgFactor.toFixed(2)}x</p>
              </div>
              <div className="rounded-3xl border-b-4 border-tertiary-fixed-dim bg-surface-container-low px-5 py-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">平均代偿率</p>
                <p className="mt-3 text-4xl font-black text-primary">{formatCompRate(avgComp)}</p>
              </div>
              <PolicyTopicButton topic={groupData.policyTopic} className="rounded-3xl border-b-4 border-outline-variant bg-surface-container-low px-5 py-5 text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">关联制度口径</p>
                <p className="mt-3 text-xl font-black text-primary">打开制度助手</p>
              </PolicyTopicButton>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
