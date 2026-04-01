import { NextResponse } from 'next/server';
import { getEvaluationReportData } from '@/lib/server/evaluation-report';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getEvaluationReportData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('获取评价报告数据失败:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}
