import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getEvaluationReportData } from '@/lib/server/evaluation-report';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getEvaluationReportData();

    const worksheetData = [
      [
        '序号',
        '机构名称',
        '简称',
        '区域',
        '评级',
        '目标规模 (亿元)',
        '实际完成 (亿元)',
        '完成率',
        '目标客户数 (万户)',
        '实际客户数 (万户)',
        '客户完成率',
        '担保放大倍数',
        '备案率',
        '分险业务占比',
        '支小支农占比',
        '担保代偿率',
        '代偿返还率',
        '政策打分',
        '分组',
      ],
      ...data.institutions.map((item, index) => [
        index + 1,
        item.name,
        item.shortName,
        item.regionLevel,
        item.rating,
        item.targetScale,
        item.actualScale,
        `${(item.completionRate * 100).toFixed(2)}%`,
        item.targetCustomer,
        item.actualCustomer,
        `${(item.customerCompletionRate * 100).toFixed(2)}%`,
        item.leverage,
        `${(item.filingRate * 100).toFixed(2)}%`,
        `${(item.riskShareRatio * 100).toFixed(2)}%`,
        `${(item.inclusiveRatio * 100).toFixed(2)}%`,
        `${(item.compensationRate * 100).toFixed(2)}%`,
        `${(item.recoveryRate * 100).toFixed(2)}%`,
        item.policyScore,
        item.displayLabel,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '机构评价表');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="2025 年度机构评价情况统计表.xlsx"`,
      },
    });
  } catch (error) {
    console.error('导出评价清单失败:', error);
    return NextResponse.json({ error: '导出失败' }, { status: 500 });
  }
}
