import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AiReviewWorkbench from '@/components/AiReviewWorkbench';
import { REVIEW_DOCUMENT_TYPES, getAiReviewContext, type ReviewDocumentType } from '@/lib/server/ai-review';

type Props = {
  searchParams?: Promise<{
    type?: string;
  }>;
};

function normalizeType(value?: string): ReviewDocumentType {
  if (value && REVIEW_DOCUMENT_TYPES.includes(value as ReviewDocumentType)) {
    return value as ReviewDocumentType;
  }
  return 'evaluation';
}

export const dynamic = 'force-dynamic';

export default async function AiReviewPage({ searchParams }: Props) {
  const params = await searchParams;
  const hasExplicitType = typeof params?.type === 'string';
  const type = normalizeType(params?.type);
  const context = await getAiReviewContext(type);

  return (
    <>
      <Sidebar />
      <Header />
      <AiReviewWorkbench initialContext={context} startEmpty={!hasExplicitType} />
    </>
  );
}
