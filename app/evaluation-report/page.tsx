import Link from 'next/link';
import { Download, FileSpreadsheet, Target, TrendingUp } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { getEvaluationReportData } from '@/lib/server/evaluation-report';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams?: Promise<{
    group?: string;
    year?: string;
    [key: string]: string | undefined;
  }>;
};

function formatNumber(value: number, digits = 2) {
  return value.toFixed(digits);
}

function formatRatio(value: number, digits = 2) {
  return `${(value * 100).toFixed(digits)}%`;
}

export default async function EvaluationReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const data = await getEvaluationReportData();
  const selectedGroup = typeof params?.group === 'string' ? params.group : undefined;
  const institutions = selectedGroup ? data.institutions.filter((item) => item.overallStatus === selectedGroup) : data.institutions;

  return (
    <>
      <Sidebar />
      <Header />

      <main className="ml-48 min-h-screen overflow-x-hidden bg-surface px-6 pb-8 pt-20">
        <section className="mb-6 flex items-end justify-between gap-6">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-on-surface-variant">
              <span>Admin</span>
              <span>/</span>
              <span>Report Center</span>
            </nav>
            <h1 className="font-headline text-[3.1rem] font-black leading-none tracking-tight text-primary">机构评价报告</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
              2025 年度合作担保机构经营情况与政策目标完成评价报告生成与分析
            </p>
          </div>
        </section>

        <section className="mb-5 grid grid-cols-12 gap-3">
          <div className="col-span-12 rounded-3xl bg-white p-5 shadow-sm md:col-span-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-secondary">目标总规模</span>
              <span className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-black text-secondary">2025 Task</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="font-headline text-[3.25rem] font-black leading-none text-primary">{data.stats.targetTotal.toFixed(1)}</span>
              <span className="mb-1 text-base font-bold text-on-surface-variant">亿元</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">实际完成</p>
                <p className="mt-1 text-lg font-black text-primary">{data.stats.actualTotal.toFixed(1)} <span className="text-xs font-semibold text-on-surface-variant">亿元</span></p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">合作机构</p>
                <p className="mt-1 text-lg font-black text-primary">{data.stats.institutionCount} <span className="text-xs font-semibold text-on-surface-variant">家</span></p>
              </div>
            </div>
          </div>

          <div className="col-span-6 rounded-3xl bg-surface-container-low p-5 shadow-sm md:col-span-3">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
              <Target className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">总体完成率</p>
            <p className="mt-2 text-[2rem] font-black text-primary">{formatRatio(data.stats.overallCompletionRate)} <span className="text-sm font-semibold text-on-surface-variant"></span></p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-secondary" style={{ width: `${Math.min(data.stats.overallCompletionRate * 100, 100)}%` }} />
            </div>
          </div>

          <div className="col-span-6 rounded-3xl bg-surface-container-low p-5 shadow-sm md:col-span-3">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">优秀良好机构</p>
            <p className="mt-2 text-[2rem] font-black text-primary">{data.stats.excellentCount + data.stats.goodCount} <span className="text-sm font-semibold text-on-surface-variant">家</span></p>
            <div className="mt-3 flex gap-2 text-[11px] text-on-surface-variant">
              <span>优秀：{data.stats.excellentCount}家</span>
              <span>良好：{data.stats.goodCount}家</span>
            </div>
          </div>

        </section>

        <section className="min-w-0 overflow-hidden rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-headline text-xl font-black text-primary">合作担保机构评价情况统计表</h2>
              <p className="mt-1.5 text-sm text-on-surface-variant">以下列表按 Excel 评价表逐行展示全部字段，可按完成率分组筛选。</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/api/evaluation-report/export-list" className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-2 text-xs font-black text-primary">
                <Download className="mr-2 inline h-4 w-4" />
                导出清单
              </Link>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Link href="/evaluation-report" className={`rounded-full px-3 py-1.5 text-[11px] font-black ${!selectedGroup ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'}`}>
                全部
              </Link>
              {data.groups.map((group) => (
                <Link key={group.key} href={`/evaluation-report?group=${group.key}`} className={`rounded-full px-3 py-1.5 text-[11px] font-black ${selectedGroup === group.key ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'}`}>
                  {group.title}
                </Link>
              ))}
            </div>
            <div className="text-xs text-on-surface-variant">
              共 {institutions.length} 家机构 · 按 8 项指标完成率排序
            </div>
          </div>

          <div className="max-w-full overflow-x-auto rounded-3xl border border-outline-variant/20 bg-surface-container-low">
            <table className="min-w-[2000px] border-collapse text-[11px] text-on-surface">
              <thead>
                <tr className="border-b border-outline-variant/15 text-left text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
                  <th className="px-4 py-3">机构名称</th>
                  <th className="px-3 py-3">简称</th>
                  <th className="px-3 py-3">区域</th>
                  <th className="px-3 py-3">评级</th>
                  <th className="px-3 py-3 text-right">规模完成率</th>
                  <th className="px-3 py-3 text-right">客户完成率</th>
                  <th className="px-3 py-3 text-right">再担保完成率</th>
                  <th className="px-3 py-3 text-right">分险完成率</th>
                  <th className="px-3 py-3 text-right">杠杆完成率</th>
                  <th className="px-3 py-3 text-right">代偿率状态</th>
                  <th className="px-3 py-3 text-right">返还完成率</th>
                  <th className="px-3 py-3 text-right">备案完成率</th>
                  <th className="px-3 py-3 text-right">政策打分</th>
                  <th className="px-3 py-3">综合评价</th>
                  <th className="px-3 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-surface-container-low/40'}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold text-primary">{item.name}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-on-surface-variant">{item.shortName}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.regionLevel === '省级' ? 'bg-primary/10 text-primary' :
                        item.regionLevel === '市级' ? 'bg-secondary/10 text-secondary' :
                        'bg-tertiary/10 text-tertiary'
                      }`}>
                        {item.regionLevel}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-on-surface-variant">{item.rating}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.scaleCompletionRate >= 1.0 ? 'bg-emerald-100 text-emerald-700' :
                        item.scaleCompletionRate >= 0.9 ? 'bg-blue-100 text-blue-700' :
                        item.scaleCompletionRate >= 0.7 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {formatRatio(item.scaleCompletionRate)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-on-surface-variant">{formatRatio(item.customerRatioCompletionRate)}</td>
                    <td className="px-3 py-3 text-right text-on-surface-variant">{formatRatio(item.reGuaranteeCompletionRate)}</td>
                    <td className="px-3 py-3 text-right text-on-surface-variant">{formatRatio(item.riskShareCompletionRate)}</td>
                    <td className="px-3 py-3 text-right text-on-surface-variant">{formatRatio(item.leverageCompletionRate)}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.compensationRateStatus === '达标' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.compensationRateStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-on-surface-variant">{formatRatio(item.recoveryRateCompletionRate)}</td>
                    <td className="px-3 py-3 text-right text-on-surface-variant">{formatRatio(item.filingRate || 0)}</td>
                    <td className="px-3 py-3 text-right text-on-surface-variant">{formatNumber(item.policyScore, 1)}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold ${
                        item.overallStatus === '优秀' ? 'bg-emerald-100 text-emerald-700' :
                        item.overallStatus === '良好' ? 'bg-blue-100 text-blue-700' :
                        item.overallStatus === '达标' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.overallStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/evaluation-report/generate?id=${item.id}`}
                        className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-white hover:bg-primary/90"
                      >
                        生成评价报告
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
