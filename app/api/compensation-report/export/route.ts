import { NextResponse } from 'next/server';
import { getGeneratedCompensationReport } from '@/lib/server/compensation-approval-report';

export async function GET() {
  const report = await getGeneratedCompensationReport();
  if (!report) {
    return NextResponse.json({ error: '审批表尚未生成，请先在报告生成页点击生成。' }, { status: 409 });
  }

  return new NextResponse(report.rawText, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent('宝鸡三家村餐饮管理有限公司项目再担保代偿补偿审批表.txt')}`,
      'Cache-Control': 'private, max-age=60',
    },
  });
}
