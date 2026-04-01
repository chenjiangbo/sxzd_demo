import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import BriefTableViewer from '@/components/BriefTableViewer';
import { getBriefTableData } from '@/lib/server/brief-html-generator';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BriefPage() {
  let tableData: any[] = [];
  try {
    tableData = await getBriefTableData() || [];
  } catch (error) {
    console.error('加载表格数据失败:', error);
    tableData = [];
  }

  return (
    <>
      <Sidebar />
      <Header />

      <main className="ml-48 min-h-screen overflow-x-hidden bg-surface px-6 pb-8 pt-20">
        {/* 页面头部 */}
        <section className="mb-6 flex items-end justify-between gap-6">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-on-surface-variant">
              <span>Admin</span>
              <span>/</span>
              <span>Task Center</span>
            </nav>
            <h1 className="font-headline text-[3.1rem] font-black leading-none tracking-tight text-primary">担保业务简报</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
              2026 年度全国合作担保机构业务数据统计简报，包含 12 张核心业务统计表。
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/api/generate-brief"
              className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(11,28,48,0.16)] transition hover:-translate-y-0.5"
            >
              生成简报
            </Link>
          </div>
        </section>

        {/* 统计卡片 */}
        <section className="mb-5 grid grid-cols-12 gap-3">
          <div className="col-span-12 rounded-3xl bg-white p-5 shadow-sm md:col-span-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-secondary">报告期间</span>
              <span className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-black text-secondary">2026 Task</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="font-headline text-[3.25rem] font-black leading-none text-primary">2026</span>
              <span className="mb-1 text-base font-bold text-on-surface-variant">年上半年</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">统计表格</p>
                <p className="mt-1 text-lg font-black text-primary">12 <span className="text-xs font-semibold text-on-surface-variant">张</span></p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">数据截止</p>
                <p className="mt-1 text-lg font-black text-primary">6 月 30 日<span className="text-xs font-semibold text-on-surface-variant"></span></p>
              </div>
            </div>
          </div>

          <div className="col-span-6 rounded-3xl bg-surface-container-low p-5 shadow-sm md:col-span-4">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">数据来源</p>
            <p className="mt-2 text-[2rem] font-black text-primary">业务系统 <span className="text-sm font-semibold text-on-surface-variant">自动采集</span></p>
            <div className="mt-3 text-xs font-medium text-on-surface-variant">
              包含新增担保、再担保、银行合作、融资成本等核心业务指标
            </div>
          </div>

          <div className="col-span-6 rounded-3xl bg-surface-container-low p-5 shadow-sm md:col-span-4">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-white">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">简报格式</p>
            <p className="mt-2 text-[2rem] font-black text-primary">PDF <span className="text-sm font-semibold text-on-surface-variant">可转换</span></p>
            <div className="mt-3 text-xs font-medium text-on-surface-variant">
              支持导出为 HTML、PDF、Word 等多种格式文档
            </div>
          </div>
        </section>

        {/* 表格展示区域 */}
        <section className="min-w-0 overflow-hidden rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-headline text-xl font-black text-primary">担保业务统计表格</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2">
                <span className="text-[11px] font-black text-on-surface-variant">年份</span>
                <div className="flex items-center gap-1.5">
                  <button className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-black text-white">2026</button>
                  <button className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-primary">2025</button>
                </div>
              </div>
            </div>
          </div>

          <BriefTableViewer tables={tableData} />
        </section>
      </main>
    </>
  );
}
