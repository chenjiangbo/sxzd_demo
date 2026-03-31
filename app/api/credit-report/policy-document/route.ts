import { promises as fs } from 'node:fs';
import { NextResponse } from 'next/server';
import path from 'node:path';

const policyPath = path.join(process.cwd(), 'docs', '授信及评价', '陕西省信用再担保有限责任公司再担保业务授信管理办法.pdf');

export async function GET() {
  const fileBuffer = await fs.readFile(policyPath);
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent('陕西省信用再担保有限责任公司再担保业务授信管理办法.pdf')}`,
    },
  });
}
