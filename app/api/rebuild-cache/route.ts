import { NextRequest, NextResponse } from 'next/server';
import { getCaseAnalysis } from '@/lib/server/case-analysis';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const caseId = typeof body.caseId === 'string' && body.caseId ? body.caseId : 'baoji-sanjiacun';

  await getCaseAnalysis(caseId, {
    refresh: true,
    forceReextract: true,
  });

  return NextResponse.json({ ok: true });
}
