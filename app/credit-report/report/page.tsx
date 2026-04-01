import CreditReportPreviewClient from '@/components/credit/CreditReportPreviewClient';
import CreditPolicyDrawer from '@/components/credit/CreditPolicyDrawer';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { getCreditReportData } from '@/lib/server/credit-report';
import { getGeneratedCreditReport } from '@/lib/server/credit-report-draft';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams?: Promise<{
    generate?: string;
  }>;
};

export default async function CreditReportPreviewPage({ searchParams }: Props) {
  const params = await searchParams;
  const [data, initialReport] = await Promise.all([
    getCreditReportData(),
    getGeneratedCreditReport(),
  ]);
  const autoGenerate = params?.generate === '1' || !initialReport;

  return (
    <>
      <Sidebar />
      <Header />
      <CreditPolicyDrawer topics={data.policyTopics} />

      <main className="ml-48 min-h-screen bg-surface px-8 pb-32 pt-20">
        <header className="mb-8 flex items-end justify-between gap-8">
          <div>
            <nav className="mb-3 flex items-center gap-2 text-xs text-on-surface-variant">
              <span>业务管理</span>
              <span>/</span>
              <span>再担保业务授信</span>
              <span>/</span>
              <span className="font-black text-secondary">成文预览</span>
            </nav>
            <h1 className="font-headline text-4xl font-black tracking-tight text-primary">授信报告成文预览</h1>
          </div>
          <div className="rounded-xl border border-tertiary-fixed-dim/30 bg-tertiary-fixed-dim/10 px-4 py-2 text-xs font-black text-on-tertiary-container">
            进入页面后自动生成最新授信报告
          </div>
        </header>

        <div className="grid grid-cols-12 items-start gap-8">
          <CreditReportPreviewClient
            initialReport={initialReport}
            autoGenerate={autoGenerate}
            adoptedCriteria={data.report.adoptedCriteria}
            references={data.report.references}
            oaMemo={data.oaPreview.summary}
          />
        </div>
      </main>
    </>
  );
}
