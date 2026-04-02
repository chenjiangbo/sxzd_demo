import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { REVIEW_DOCUMENT_TYPES, submitAiReview, type ReviewDocumentType } from '@/lib/server/ai-review';

const requestSchema = z.object({
  type: z.enum(REVIEW_DOCUMENT_TYPES),
  note: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());
    const result = await submitAiReview(body.type as ReviewDocumentType, body.note);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 复核提交失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
