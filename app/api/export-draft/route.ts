import { NextRequest, NextResponse } from 'next/server';
import { getCaseAnalysis } from '@/lib/server/case-analysis';

export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get('kind');
  if (!kind || !['worksheet', 'approval', 'oa'].includes(kind)) {
    return NextResponse.json({ error: 'Invalid draft kind' }, { status: 400 });
  }

  const analysis = await getCaseAnalysis('baoji-sanjiacun');
  const draft = analysis.drafts[kind as 'worksheet' | 'approval' | 'oa'];
  const content = `${draft.title}\n\n${draft.body}\n\n人工复核点：\n${draft.manualReviewPoints.map((item) => `- ${item}`).join('\n')}`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`${draft.title}.txt`)}`,
      'Cache-Control': 'private, max-age=60',
    },
  });
}
