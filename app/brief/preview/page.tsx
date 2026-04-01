import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import BriefPreviewClient from '@/components/BriefPreviewClient';

export const dynamic = 'force-dynamic';

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

        <BriefPreviewClient />
      </main>
    </>
  );
}
