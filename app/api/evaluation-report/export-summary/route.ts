import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getEvaluationReportData } from '@/lib/server/evaluation-report';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getEvaluationReportData();

    const summaryData = [
      ['指标', '数值', '备注'],
      ['合作机构总数', data.stats.institutionCount, '家'],
      ['目标总规模', data.stats.targetTotal, '亿元'],
      ['实际完成', data.stats.actualTotal, '亿元'],
      ['总体完成率', `${(data.stats.overallCompletionRate * 100).toFixed(2)}%`, ''],
      ['优秀机构数量', data.stats.excellentCount, '家'],
      ['良好机构数量', data.stats.goodCount, '家'],
      ['', '', ''],
      ['分组统计', '', ''],
      ...data.groups.flatMap((group) => [
        [group.title, `${group.count}家`, `平均完成率${(group.avgCompletionRate * 100).toFixed(2)}%`],
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '评价摘要');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="2025 年度机构评价摘要.xlsx"`,
      },
    });
  } catch (error) {
    console.error('导出评价摘要失败:', error);
    return NextResponse.json({ error: '导出失败' }, { status: 500 });
  }
}
