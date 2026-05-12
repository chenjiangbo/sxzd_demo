import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getCreditPromptConfig,
  getDefaultCreditPromptConfig,
  saveCreditPromptConfig,
} from '@/lib/server/credit-report-prompt-config';

const resourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(['template', 'policy', 'data', 'structured']),
  path: z.string().min(1).optional(),
  purpose: z.string().min(1),
});

const promptConfigSchema = z.object({
  businessRequirements: z.array(z.string().min(1)).min(1),
  technicalRequirements: z.array(z.string().min(1)).min(1),
  templateConstraints: z.array(z.string().min(1)).min(1),
  resources: z.array(resourceSchema).min(1),
});

export async function GET() {
  const config = await getCreditPromptConfig();
  return NextResponse.json({ config });
}

export async function POST(request: Request) {
  const body = await request.json();
  const config = await saveCreditPromptConfig(promptConfigSchema.parse(body));
  return NextResponse.json({ config });
}

export async function DELETE() {
  const config = getDefaultCreditPromptConfig();
  await saveCreditPromptConfig(config);
  return NextResponse.json({ config });
}
