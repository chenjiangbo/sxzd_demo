import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AiAssistant from '@/components/AiAssistant';
import CaseWorkbench from '@/components/CaseWorkbench';
import { getCaseAnalysis } from '@/lib/server/case-analysis';
import { getGeneratedCompensationReport } from '@/lib/server/compensation-approval-report';
import { getStepArtifact } from '@/lib/server/step-artifacts';

type Props = {
  searchParams?: Promise<{
    step?: string;
    refresh?: string;
    reextract?: string;
    doc?: string;
    material?: string;
    rule?: string;
    draft?: 'worksheet' | 'approval' | 'oa';
  }>;
};

export const dynamic = 'force-dynamic';

function normalizeStep(step?: string) {
  if (!step) return 'overview';
  if (step === 'evidence') return 'verify';
  return step;
}

export default async function WorkbenchPage({ searchParams }: Props) {
  const params = await searchParams;
  const analysis = await getCaseAnalysis('baoji-sanjiacun', {
    refresh: params?.refresh === '1',
    forceReextract: params?.reextract === '1',
  });
  const stepKey = normalizeStep(params?.step);
  const initialGeneratedReport = stepKey === 'document' ? await getGeneratedCompensationReport() : null;
  const stepArtifact = stepKey === 'overview' ? null : await getStepArtifact(stepKey, analysis, { refresh: params?.refresh === '1' });

  return (
    <>
      <Sidebar />
      <Header />
      <CaseWorkbench
        currentStepKey={stepKey}
        analysis={analysis}
        selectedDocumentId={params?.doc}
        selectedMaterialName={params?.material}
        selectedRuleName={params?.rule}
        selectedDraftKey={params?.draft}
        stepArtifact={stepArtifact ?? undefined}
        initialGeneratedReport={initialGeneratedReport}
      />
      <AiAssistant />
    </>
  );
}
