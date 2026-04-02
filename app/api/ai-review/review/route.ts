import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { REVIEW_DOCUMENT_TYPES, runAiReview, type ReviewDocumentType } from '@/lib/server/ai-review';

const requestSchema = z.object({
  type: z.enum(REVIEW_DOCUMENT_TYPES),
  message: z.string().min(1, 'message is required'),
  action: z.enum(['start', 'message']),
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());
    const result = await runAiReview(body.type as ReviewDocumentType, body.message, body.action);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 复核失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
