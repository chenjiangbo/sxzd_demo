import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import BriefTableViewer from '@/components/BriefTableViewer';
import { getBriefTableData } from '@/lib/server/brief-html-generator';

export const dynamic = 'force-dynamic';

export default async function BriefTablePage() {
  const tableData = await getBriefTableData();

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
              <span className="font-black text-secondary">担保业务简报</span>
            </nav>
            <h1 className="font-headline text-4xl font-black tracking-tight text-primary">担保业务简报数据预览</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
              以下展示全部 12 张担保业务统计表格，确认数据无误后可生成正式简报文档。
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/brief/preview"
              className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(11,28,48,0.16)] transition hover:-translate-y-0.5"
            >
              生成简报预览
            </a>
          </div>
        </header>

        <BriefTableViewer tables={tableData} />
      </main>
    </>
  );
}
