import { NextRequest, NextResponse } from 'next/server';
import { saveEditedCompensationReport } from '@/lib/server/compensation-approval-report';
import type { GeneratedCompensationReport } from '@/lib/compensation-report-format';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== 'object' || !('report' in body)) {
    return NextResponse.json({ error: '缺少审批表内容' }, { status: 400 });
  }

  try {
    const saved = await saveEditedCompensationReport(body.report as GeneratedCompensationReport);
    return NextResponse.json({ ok: true, report: saved });
  } catch (error) {
    return NextResponse.json(
      { error: `审批表保存失败：${(error as Error).message}` },
      { status: 500 },
    );
  }
}
