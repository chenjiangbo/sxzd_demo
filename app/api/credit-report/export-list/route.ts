import { NextResponse } from 'next/server';
import { getCreditReportData } from '@/lib/server/credit-report';

export async function GET() {
  const data = await getCreditReportData();
  const header = ['机构名称', '分组', '2024备案规模(亿元)', '总授信额度(亿元)', '非分险额度(亿元)', '分险额度(亿元)', '国企额度(亿元)', '机构评价'];
  const lines = [
    header.join(','),
    ...data.institutions.map((item) =>
      [
        item.name,
        item.displayLabel,
        item.scale2024.toFixed(3),
        item.totalCredit.toFixed(3),
        item.nonRiskCredit.toFixed(3),
        item.riskCredit.toFixed(3),
        item.soeCredit.toFixed(3),
        item.rating,
      ].join(','),
    ),
  ].join('\n');

  return new NextResponse(lines, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent('2025年度授信机构清单.csv')}`,
    },
  });
}
