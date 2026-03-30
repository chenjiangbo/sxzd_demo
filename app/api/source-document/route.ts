import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getCaseAnalysis } from '@/lib/server/case-analysis';

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
};

export async function GET(request: NextRequest) {
  const documentId = request.nextUrl.searchParams.get('id');
  if (!documentId) {
    return NextResponse.json({ error: 'Missing document id' }, { status: 400 });
  }

  const analysis = await getCaseAnalysis('baoji-sanjiacun');
  const document = analysis.documents.find((item) => item.id === documentId);
  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const fileBuffer = await fs.readFile(document.absolutePath);
  const extension = path.extname(document.name).toLowerCase();
  const contentType = CONTENT_TYPES[extension] ?? 'application/octet-stream';

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(document.name)}`,
      'Cache-Control': 'private, max-age=60',
    },
  });
}
