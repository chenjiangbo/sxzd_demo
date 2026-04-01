import { NextResponse } from 'next/server';
import { getCreditReportData } from '@/lib/server/credit-report';

export async function GET() {
  const data = await getCreditReportData();
  const content = [
    '2025 年度授信结论摘要',
    '',
    data.summary.oneLiner,
    '',
    '关键亮点：',
    ...data.summary.highlights.map((item) => `- ${item}`),
    '',
    '待确认事项：',
    ...data.pendingItems.map((item) => `- ${item.title}：${item.description}${item.checked ? '（已确认）' : '（待确认）'}`),
  ].join('\n');

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent('2025年度授信结论摘要.txt')}`,
    },
  });
}
