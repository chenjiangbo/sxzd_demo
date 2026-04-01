import Link from 'next/link';
import { Download, FileSpreadsheet, ShieldCheck, Sparkles } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CreditPolicyDrawer from '@/components/credit/CreditPolicyDrawer';
import { getCreditReportData } from '@/lib/server/credit-report';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams?: Promise<{
    group?: string;
    year?: string;
    [key: string]: string | undefined;
  }>;
};

function statusTone(groupKey: string) {
  if (groupKey === 'application') return 'bg-tertiary-fixed-dim/20 text-on-tertiary-container';
  if (groupKey === 'policy_target') return 'bg-secondary/10 text-secondary';
  if (groupKey === 'measured') return 'bg-surface-container text-primary';
  return 'bg-primary text-white';
}

function formatNumber(value: number, digits = 2) {
  return value.toFixed(digits);
}

function formatRatio(value: number | string, digits = 2) {
  if (typeof value === 'string') return value;
  return `${(value * 100).toFixed(digits)}%`;
}

function formatPlain(value: number | string, digits = 3) {
  if (typeof value === 'string') return value;
  return value.toFixed(digits);
}

export default async function CreditReportTaskPage({ searchParams }: Props) {
  const params = await searchParams;
  const data = await getCreditReportData();
  const selectedGroup = typeof params?.group === 'string' ? params.group : undefined;
  const rawYear = typeof params?.year === 'string' ? Number(params.year) : NaN;
  const selectedYear = data.availableYears.includes(rawYear) ? rawYear : data.availableYears[0];
  const institutions = selectedGroup ? data.institutions.filter((item) => item.groupKey === selectedGroup) : data.institutions;

  return (
    <>
      <Sidebar />
      <Header />
      <CreditPolicyDrawer topics={data.policyTopics} />

      <main className="ml-48 min-h-screen overflow-x-hidden bg-surface px-6 pb-8 pt-20">
        <section className="mb-6 flex items-end justify-between gap-6">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-on-surface-variant">
              <span>Admin</span>
              <span>/</span>
              <span>Task Center</span>
            </nav>
            <h1 className="font-headline text-[3.1rem] font-black leading-none tracking-tight text-primary">年度授信任务</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
              {selectedYear} 年度全国合作担保机构授信额度综合核定与配置任务，包含银担及非银担风险分担结构优化。
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/api/credit-report/export-summary" className="rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm font-bold text-primary transition hover:bg-surface-container-low">
              导出摘要
            </Link>
            <Link href="/credit-report/report?generate=1" className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(11,28,48,0.16)] transition hover:-translate-y-0.5">
              <FileSpreadsheet className="h-4 w-4" />
              生成授信报告
            </Link>
          </div>
        </section>

        <section className="mb-5 grid grid-cols-12 gap-3">
          <div className="col-span-12 rounded-3xl bg-white p-5 shadow-sm md:col-span-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-secondary">申请总额</span>
              <span className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-black text-secondary">2025 Task</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="font-headline text-[3.25rem] font-black leading-none text-primary">{data.stats.applicationTotal.toFixed(1)}</span>
              <span className="mb-1 text-base font-bold text-on-surface-variant">亿元</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">拟授信总额</p>
                <p className="mt-1 text-lg font-black text-primary">{data.stats.grantedTotal.toFixed(1)} <span className="text-xs font-semibold text-on-surface-variant">亿元</span></p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">合作机构</p>
                <p className="mt-1 text-lg font-black text-primary">{data.stats.institutionCount} <span className="text-xs font-semibold text-on-surface-variant">家</span></p>
              </div>
            </div>
          </div>

          <div className="col-span-6 rounded-3xl bg-surface-container-low p-5 shadow-sm md:col-span-3">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">银担分险额度</p>
            <p className="mt-2 text-[2rem] font-black text-primary">{data.stats.riskCreditTotal.toFixed(1)} <span className="text-sm font-semibold text-on-surface-variant">亿元</span></p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-secondary" style={{ width: `${(data.stats.riskCreditTotal / data.stats.grantedTotal) * 100}%` }} />
            </div>
          </div>

          <div className="col-span-6 rounded-3xl bg-surface-container-low p-5 shadow-sm md:col-span-3">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">非银担分险额度</p>
            <p className="mt-2 text-[2rem] font-black text-primary">{data.stats.nonRiskCreditTotal.toFixed(1)} <span className="text-sm font-semibold text-on-surface-variant">亿元</span></p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(data.stats.nonRiskCreditTotal / data.stats.grantedTotal) * 100}%` }} />
            </div>
          </div>

        </section>

        <section className="min-w-0 overflow-hidden rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-headline text-xl font-black text-primary">合作担保机构授信情况统计表</h2>
              <p className="mt-1.5 text-sm text-on-surface-variant">以下列表按 Excel 统计表逐行展示全部字段，可按年度与口径筛选。</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2">
                <span className="text-[11px] font-black text-on-surface-variant">年份</span>
                <div className="flex items-center gap-1.5">
                  {data.availableYears.map((year) => (
                    <Link
                      key={year}
                      href={year === data.availableYears[0] ? `/credit-report${selectedGroup ? `?group=${selectedGroup}` : ''}` : `/credit-report?year=${year}${selectedGroup ? `&group=${selectedGroup}` : ''}`}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-black ${selectedYear === year ? 'bg-primary text-white' : 'bg-white text-primary'}`}
                    >
                      {year}
                    </Link>
                  ))}
                </div>
              </div>
              <Link href="/api/credit-report/export-list" className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-2 text-xs font-black text-primary">
                <Download className="mr-2 inline h-4 w-4" />
                导出清单
              </Link>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <Link href={selectedYear === data.availableYears[0] ? '/credit-report' : `/credit-report?year=${selectedYear}`} className={`rounded-full px-3 py-1.5 text-[11px] font-black ${!selectedGroup ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'}`}>
              全部
            </Link>
            {data.groups.map((group) => (
              <Link key={group.key} href={`/credit-report?${selectedYear !== data.availableYears[0] ? `year=${selectedYear}&` : ''}group=${group.key}`} className={`rounded-full px-3 py-1.5 text-[11px] font-black ${selectedGroup === group.key ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'}`}>
                {group.title}
              </Link>
            ))}
          </div>

          <div className="max-w-full overflow-x-auto rounded-3xl border border-outline-variant/20 bg-surface-container-low">
            <table className="min-w-[2500px] border-collapse text-[11px] text-on-surface">
              <thead>
                <tr className="border-b border-outline-variant/15 text-left text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
                  <th className="px-4 py-3">机构名称</th>
                  <th className="px-3 py-3">简称</th>
                  <th className="px-3 py-3">区域</th>
                  <th className="px-3 py-3">口径类别</th>
                  <th className="px-3 py-3">评级</th>
                  <th className="px-3 py-3 text-right">2024备案规模</th>
                  <th className="px-3 py-3 text-right">担保放大倍数</th>
                  <th className="px-3 py-3 text-right">担保放大倍系数</th>
                  <th className="px-3 py-3 text-right">备案率</th>
                  <th className="px-3 py-3 text-right">备案率系数</th>
                  <th className="px-3 py-3 text-right">分险业务占比</th>
                  <th className="px-3 py-3 text-right">分险占比系数</th>
                  <th className="px-3 py-3 text-right">支小支农占比</th>
                  <th className="px-3 py-3 text-right">支小支农系数</th>
                  <th className="px-3 py-3 text-right">担保代偿率</th>
                  <th className="px-3 py-3 text-right">代偿率系数</th>
                  <th className="px-3 py-3 text-right">代偿返还率</th>
                  <th className="px-3 py-3 text-right">返还率系数</th>
                  <th className="px-3 py-3 text-right">政策目标打分</th>
                  <th className="px-3 py-3 text-right">政策目标系数</th>
                  <th className="px-3 py-3 text-right">额度系数</th>
                  <th className="px-3 py-3 text-right">再担保增长率</th>
                  <th className="px-3 py-3 text-right">测算额度</th>
                  <th className="px-3 py-3 text-right">其中：国企额度</th>
                  <th className="px-3 py-3 text-right">2025非分险额度</th>
                  <th className="px-3 py-3 text-right">2025分险额度</th>
                  <th className="px-3 py-3">详情</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-surface-container-low/40'}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold text-primary">{item.name}</p>
                        <p className="mt-0.5 text-[10px] text-on-surface-variant">{item.id}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium">{item.shortName}</td>
                    <td className="px-3 py-3">{item.regionLevel}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${statusTone(item.groupKey)}`}>{item.displayLabel}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-primary">{item.rating}</span>
                    </td>
                    <td className="px-3 py-3 text-right">{formatNumber(item.scale2024)}</td>
                    <td className="px-3 py-3 text-right">{formatPlain(item.leverage)}</td>
                    <td className="px-3 py-3 text-right">{formatNumber(item.leverageFactor, 3)}</td>
                    <td className="px-3 py-3 text-right">{formatRatio(item.filingRate)}</td>
                    <td className="px-3 py-3 text-right">{formatNumber(item.filingFactor, 3)}</td>
                    <td className="px-3 py-3 text-right">{formatRatio(item.riskShareRatio)}</td>
                    <td className="px-3 py-3 text-right">{formatNumber(item.riskShareFactor, 3)}</td>
                    <td className="px-3 py-3 text-right">{formatRatio(item.inclusiveRatio)}</td>
                    <td className="px-3 py-3 text-right">{formatNumber(item.inclusiveFactor, 3)}</td>
                    <td className="px-3 py-3 text-right">{formatRatio(item.compensationRate)}</td>
                    <td className="px-3 py-3 text-right">{formatNumber(item.compensationFactor, 3)}</td>
                    <td className="px-3 py-3 text-right">{formatRatio(item.recoveryRate)}</td>
                    <td className="px-3 py-3 text-right">{formatNumber(item.recoveryFactor, 3)}</td>
                    <td className="px-3 py-3 text-right">{formatNumber(item.policyScore, 0)}</td>
                    <td className="px-3 py-3 text-right">{formatNumber(item.policyFactor, 3)}</td>
                    <td className="px-3 py-3 text-right">{formatNumber(item.factor, 3)}</td>
                    <td className="px-3 py-3 text-right">{formatRatio(item.growthRate)}</td>
                    <td className="px-3 py-3 text-right font-bold text-secondary">{formatNumber(item.totalCredit)}</td>
                    <td className="px-3 py-3 text-right">{formatNumber(item.soeCredit, 3)}</td>
                    <td className="px-3 py-3 text-right">{formatNumber(item.nonRiskCredit, 3)}</td>
                    <td className="px-3 py-3 text-right">{formatNumber(item.riskCredit, 3)}</td>
                    <td className="px-3 py-3">
                      <Link href={`/credit-report/detail/${item.groupKey}`} className="text-[11px] font-black text-primary underline underline-offset-4">
                        查看
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
