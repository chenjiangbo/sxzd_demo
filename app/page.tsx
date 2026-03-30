import { Banknote, Building2, CheckCircle2, CircleAlert, FileSearch, Info, Landmark, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AiAssistant from '@/components/AiAssistant';
import StartReviewButton from '@/components/StartReviewButton';
import { getCaseSummaries } from '@/lib/server/case-analysis';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const cases = await getCaseSummaries();
  const primaryCase = cases[0];

  return (
    <>
      <Sidebar />
      <Header />

      <main data-page-shell="true" className="ml-48 mt-16 min-h-screen min-w-0 flex-1 bg-background p-6 font-body text-on-surface transition-[padding-right,margin-right] duration-200">
        <section className="mb-6 flex items-end justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">Business Queue</span>
            <h1 className="mt-1.5 font-headline text-2xl font-black text-primary">代偿补偿待审案件池</h1>
            <p className="mt-1 text-sm text-on-surface-variant">当前队列：代偿补偿待审 / 审查模式：单笔单审</p>
          </div>
        </section>

        <div className="mb-5 flex items-center space-x-3 rounded-xl border border-tertiary-fixed-dim/20 bg-tertiary-container/5 p-3">
          <Info className="h-5 w-5 fill-on-tertiary-container/20 text-on-tertiary-container" />
          <p className="text-sm font-medium text-on-tertiary-container">
            案件数据已同步自国担数字化平台 / 省级分中心 / 数据中台，系统已自动完成资料归集和初步结构化处理。
          </p>
        </div>

        <section className="mb-5 grid grid-cols-12 gap-4">
          <div className="col-span-12 rounded-xl bg-surface-container-lowest p-5 shadow-[-20px_0_40px_rgba(11,28,48,0.04)] lg:col-span-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">待审案件数</p>
            <div className="flex items-end space-x-4">
              <span className="text-4xl font-black leading-none text-primary">{cases.length}</span>
              <span className="mb-1 flex items-center text-xs font-bold text-error">
                <TrendingUp className="mr-1 h-4 w-4" />
                单案 Demo 已接入真实材料
              </span>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-full w-full bg-primary" />
            </div>
          </div>

          <div className="col-span-6 rounded-xl bg-surface-container-lowest p-4 lg:col-span-2">
            <p className="mb-1 text-xs font-medium text-on-surface-variant">AI 初检完成</p>
            <span className="text-2xl font-bold text-on-tertiary-container">{cases.length}</span>
            <div className="mt-2 text-[10px] text-on-surface-variant">完成率 100%</div>
          </div>

          <div className="col-span-6 rounded-xl bg-surface-container-lowest p-4 lg:col-span-2">
            <p className="mb-1 text-xs font-medium text-on-surface-variant">待人工复核</p>
            <span className="text-2xl font-bold text-secondary">1</span>
            <div className="mt-2 text-[10px] text-on-surface-variant">法代变更 / 用途追溯</div>
          </div>

          <div className="col-span-6 rounded-xl bg-surface-container-lowest p-4 lg:col-span-2">
            <p className="mb-1 text-xs font-medium text-on-surface-variant">今日可提交 OA</p>
            <span className="text-2xl font-bold text-on-surface">1</span>
            <div className="mt-2 text-[10px] text-on-surface-variant">待最后复核</div>
          </div>

          <div className="col-span-6 rounded-xl border border-error-container bg-error-container/30 p-4 lg:col-span-2">
            <p className="mb-1 text-xs font-bold text-error">风险待确认</p>
            <span className="text-2xl font-black text-error">3</span>
            <div className="mt-2 text-[10px] text-on-error-container">演示重点项</div>
          </div>
        </section>

        <div className="space-y-3">
          <div className="grid grid-cols-12 px-5 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant/60">
            <div className="col-span-3">债务人 / 担保机构</div>
            <div className="col-span-2">债权人</div>
            <div className="col-span-2">主债权金额 / 申请补偿</div>
            <div className="col-span-2">当前状态</div>
            <div className="col-span-1 text-center">风险等级</div>
            <div className="col-span-2 px-4 text-right">操作</div>
          </div>

          <div className="grid grid-cols-12 items-center rounded-xl bg-surface-container-lowest px-5 py-4 transition-all group hover:shadow-lg hover:shadow-slate-200/50">
            <div className="col-span-3">
              <h3 className="mb-1 font-bold text-primary">{primaryCase.company}</h3>
              <p className="flex items-center text-xs text-on-surface-variant">
                <Building2 className="mr-1 h-3.5 w-3.5 text-slate-400" />
                {primaryCase.guarantor}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-1 text-[10px] font-bold text-primary">
                  <Sparkles className="h-3 w-3" />
                  代偿补偿
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-1 text-[10px] font-bold text-primary">
                  <ShieldCheck className="h-3 w-3" />
                  单笔单审
                </span>
              </div>
            </div>
            <div className="col-span-2">
              <p className="flex items-center gap-1 text-sm font-medium text-on-surface">
                <Landmark className="h-3.5 w-3.5 text-slate-400" />
                {primaryCase.bank}
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-1 text-[10px] font-bold text-secondary">
                  <FileSearch className="h-3 w-3" />
                  台账已同步
                </span>
              </div>
            </div>
            <div className="col-span-2">
              <p className="flex items-center gap-1 text-sm font-black text-primary">
                <Banknote className="h-3.5 w-3.5 text-slate-400" />
                {primaryCase.amount}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">{primaryCase.compensationAmount}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-surface-container-low px-2.5 py-1 text-[10px] font-bold text-primary">责任比例 40%</span>
                <span className="rounded-full bg-surface-container-low px-2.5 py-1 text-[10px] font-bold text-primary">资料已归集</span>
              </div>
            </div>
            <div className="col-span-2">
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-fixed-dim/20 px-2.5 py-1 text-[10px] font-bold text-on-tertiary-container">
                  <CheckCircle2 className="h-3.5 w-3.5 fill-on-tertiary-container text-white" />
                  AI 初检已完成
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-bold text-secondary">
                  <CircleAlert className="h-3.5 w-3.5" />
                  {primaryCase.statusLabel}
                </span>
              </div>
            </div>
            <div className="col-span-1 text-center">
              <span className="rounded-full bg-secondary-fixed px-3 py-1 text-[10px] font-black text-on-secondary-fixed">{primaryCase.riskLabel}</span>
            </div>
            <div className="col-span-2 px-4 text-right">
              <StartReviewButton />
            </div>
          </div>
        </div>
      </main>

      <AiAssistant />
    </>
  );
}
