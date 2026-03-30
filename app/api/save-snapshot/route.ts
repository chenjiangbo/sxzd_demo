import path from 'node:path';
import { promises as fs } from 'node:fs';
import { NextRequest, NextResponse } from 'next/server';
import { getCaseAnalysis } from '@/lib/server/case-analysis';
import { getDemoCacheRoot } from '@/lib/server/runtime-root';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const caseId = typeof body.caseId === 'string' && body.caseId ? body.caseId : 'baoji-sanjiacun';
  const step = typeof body.step === 'string' && body.step ? body.step : 'overview';

  const analysis = await getCaseAnalysis(caseId);
  const snapshotDir = path.join(getDemoCacheRoot(), 'snapshots');
  await fs.mkdir(snapshotDir, { recursive: true });

  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const snapshotPath = path.join(snapshotDir, `${caseId}-${step}-${stamp}.json`);

  await fs.writeFile(
    snapshotPath,
    JSON.stringify(
      {
        step,
        savedAt: now.toISOString(),
        analysis,
      },
      null,
      2,
    ),
    'utf8',
  );

  return NextResponse.json({
    ok: true,
    savedAt: now.toISOString(),
    snapshotPath,
  });
}
