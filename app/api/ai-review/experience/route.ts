import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteAiReviewExperience, REVIEW_DOCUMENT_TYPES, type ReviewDocumentType } from '@/lib/server/ai-review';

const requestSchema = z.object({
  type: z.enum(REVIEW_DOCUMENT_TYPES),
  id: z.string().min(1),
});

export async function DELETE(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());
    const result = await deleteAiReviewExperience(body.type as ReviewDocumentType, body.id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除沉淀经验失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
