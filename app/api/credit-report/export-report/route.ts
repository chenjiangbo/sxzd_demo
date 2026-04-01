import path from 'node:path';
import { promises as fs } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';
import { getDemoCacheRoot } from '@/lib/server/runtime-root';
import { getGeneratedCreditReport, renderCreditReportHtml } from '@/lib/server/credit-report-draft';

const execFileAsync = promisify(execFile);

export async function GET() {
  const report = await getGeneratedCreditReport();
  if (!report) {
    return NextResponse.json({ error: '授信报告尚未生成，请先在预览页完成生成。' }, { status: 409 });
  }

  const exportDir = path.join(getDemoCacheRoot(), 'credit-report-exports');
  await fs.mkdir(exportDir, { recursive: true });
  const htmlPath = path.join(exportDir, 'credit-report.html');
  const docxPath = path.join(exportDir, '关于2025年度合作担保机构再担保业务授信的报告.docx');

  await fs.writeFile(htmlPath, renderCreditReportHtml(report), 'utf8');
  await fs.rm(docxPath, { force: true });
  await execFileAsync('textutil', ['-convert', 'docx', htmlPath, '-output', docxPath], {
    timeout: 120_000,
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  });

  const fileBuffer = await fs.readFile(docxPath);
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(docxPath))}`,
    },
  });
}
