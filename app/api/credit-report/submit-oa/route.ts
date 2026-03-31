import path from 'node:path';
import { promises as fs } from 'node:fs';
import { NextRequest, NextResponse } from 'next/server';
import { getCreditReportData } from '@/lib/server/credit-report';
import { getDemoCacheRoot } from '@/lib/server/runtime-root';
import { recordOaSubmission } from '@/lib/server/credit-overrides';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const memo = typeof body.memo === 'string' ? body.memo : '';
  const data = await getCreditReportData();
  const submission = await recordOaSubmission(memo || data.oaPreview.summary);
  if (!submission) {
    return NextResponse.json({ error: 'Failed to create OA submission' }, { status: 500 });
  }

  const payload = {
    referenceNo: submission.referenceNo,
    submittedAt: submission.submittedAt,
    memo: memo || data.oaPreview.summary,
    reportTitle: data.report.title,
    flow: data.oaPreview.flow,
    pendingItems: data.pendingItems.map((item) => ({
      id: item.id,
      title: item.title,
      checked: item.checked,
      remark: item.remark,
    })),
  };

  const outputDir = path.join(getDemoCacheRoot(), 'credit-report-submissions');
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${submission.referenceNo}.json`);
  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8');

  return NextResponse.json({
    ok: true,
    referenceNo: submission.referenceNo,
    submittedAt: submission.submittedAt,
    outputPath,
  });
}
