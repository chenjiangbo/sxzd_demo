import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getCaseAnalysis } from '@/lib/server/case-analysis';
import { getDemoCacheRoot } from '@/lib/server/runtime-root';

const execFileAsync = promisify(execFile);

export async function GET() {
  const analysis = await getCaseAnalysis('baoji-sanjiacun');
  const materialDir = analysis.summary.materialDir;
  const outputDir = path.join(getDemoCacheRoot(), 'exports');
  await fs.mkdir(outputDir, { recursive: true });
  const zipPath = path.join(outputDir, '宝鸡三家村材料包.zip');

  await fs.rm(zipPath, { force: true });
  await execFileAsync('ditto', ['-ck', '--sequesterRsrc', '--keepParent', materialDir, zipPath], {
    timeout: 600_000,
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  });

  const fileBuffer = await fs.readFile(zipPath);
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent('宝鸡三家村材料包.zip')}`,
      'Cache-Control': 'private, max-age=60',
    },
  });
}
