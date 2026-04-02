import { NextRequest, NextResponse } from 'next/server';
import { REVIEW_DOCUMENT_TYPES, getAiReviewContext, type ReviewDocumentType } from '@/lib/server/ai-review';

function normalizeType(value: string | null): ReviewDocumentType {
  if (value && REVIEW_DOCUMENT_TYPES.includes(value as ReviewDocumentType)) {
    return value as ReviewDocumentType;
  }
  return 'evaluation';
}

export async function GET(request: NextRequest) {
  try {
    const type = normalizeType(request.nextUrl.searchParams.get('type'));
    const context = await getAiReviewContext(type);
    return NextResponse.json(context);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'AI 复核上下文加载失败' },
      { status: 500 },
    );
  }
}
