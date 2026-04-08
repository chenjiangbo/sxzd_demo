import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CompensationBriefPreviewClient from '@/components/CompensationBriefPreviewClient';

export const dynamic = 'force-dynamic';

const adoptedCriteria = [
  '本年代偿补偿以年度目标导向为主，结合备案金额和代偿补偿情况形成统计结论。',
  '合作银行业务数据按国有大型银行、全国股份制银行、地方法人银行、互联网银行四类分组展示。',
  '相关指标包含补偿金额、金额占比、笔数、笔数占比、笔均、合作业务代偿率等核心维度。',
];

const references = [
  '输入 1：2025 年全省再担保代偿补偿业务统计表',
  '输入 2：陕西省信用再担保有限责任公司代偿补偿管理办法',
  '输入 3：2025 年度全省再担保代偿补偿及风险情况通报样稿',
];

export default function CompensationBriefPreviewPage() {
  return (
    <>
      <Sidebar />
      <Header />

      <main className="ml-48 min-h-screen bg-surface px-8 pb-32 pt-20">
        <header className="mb-8 flex items-end justify-between gap-8">
          <div>
            <nav className="mb-3 flex items-center gap-2 text-xs text-on-surface-variant">
              <span>业务管理</span>
              <span>/</span>
              <span>代偿补偿简报</span>
              <span>/</span>
              <span className="font-black text-secondary">生成预览</span>
            </nav>
            <h1 className="font-headline text-4xl font-black tracking-tight text-primary">代偿补偿简报生成预览</h1>
          </div>
          <div className="rounded-xl border border-tertiary-fixed-dim/30 bg-tertiary-fixed-dim/10 px-4 py-2 text-xs font-black text-on-tertiary-container">
            进入页面后自动生成简报
          </div>
        </header>

        <CompensationBriefPreviewClient adoptedCriteria={adoptedCriteria} references={references} />
      </main>
    </>
  );
}
