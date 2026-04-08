import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import BriefPreviewClient from '@/components/BriefPreviewClient';

export const dynamic = 'force-dynamic';

const adoptedCriteria = [
  '本期简报以 2025 年业务数据为基础，结合担保规模、分险业务占比等核心指标形成统计结论。',
  '合作银行与担保机构数据按业务规模、占比、费率等多维度展示，支持趋势分析。',
  '相关指标包含在保余额、同比增长、代偿率、综合融资成本等关键业务数据。',
];

const references = [
  '输入 1：2025 年全省担保业务统计表',
  '输入 2：陕西省信用再担保有限责任公司担保业务管理办法',
  '输入 3：2025 年全省担保业务运行情况通报样稿',
];

export default function BriefPreviewPage() {
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
              <span>担保业务简报</span>
              <span>/</span>
              <span className="font-black text-secondary">生成预览</span>
            </nav>
            <h1 className="font-headline text-4xl font-black tracking-tight text-primary">担保业务简报生成预览</h1>
          </div>
          <div className="rounded-xl border border-tertiary-fixed-dim/30 bg-tertiary-fixed-dim/10 px-4 py-2 text-xs font-black text-on-tertiary-container">
            进入页面后自动生成简报
          </div>
        </header>

        <BriefPreviewClient adoptedCriteria={adoptedCriteria} references={references} />
      </main>
    </>
  );
}
