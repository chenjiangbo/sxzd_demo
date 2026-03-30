import { NextResponse } from 'next/server';
import { getCaseAnalysis } from '@/lib/server/case-analysis';

export async function GET() {
  const analysis = await getCaseAnalysis('baoji-sanjiacun');
  const payload = {
    caseId: analysis.summary.id,
    company: analysis.summary.company,
    compensationAmount: analysis.summary.compensationAmount,
    reviewSummary: analysis.reviewSummary,
    pendingItems: analysis.rules.filter((item) => item.conclusion === '待确认').map((item) => ({
      name: item.name,
      explanation: item.explanation,
    })),
    risks: analysis.risks.map((item) => ({
      title: item.title,
      reason: item.reason,
      impact: item.impact,
    })),
    oaFlow: analysis.oaFlow,
    draftTitle: analysis.drafts.oa.title,
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      'Content-Disposition': "attachment; filename=\"oa-payload.json\"",
      'Cache-Control': 'private, max-age=60',
    },
  });
}
