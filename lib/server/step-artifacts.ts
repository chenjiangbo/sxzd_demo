import { createHash } from 'node:crypto';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { blackwhiteJson } from '@/lib/server/blackwhite';
import type { CaseAnalysis } from '@/lib/server/case-analysis';
import { getDemoCacheRoot } from '@/lib/server/runtime-root';

const STEP_ARTIFACT_VERSION = '2026-03-30-step-artifacts-v3';
const STEP_CACHE_ROOT = path.join(getDemoCacheRoot(), 'step-artifacts');

const stepArtifactSchema = z
  .union([
    z.object({
      summary: z.string().min(1),
      highlights: z.array(z.string()).default([]),
      callouts: z.array(z.string()).default([]),
    }),
    z.object({
      current_step_description: z.object({
        summary: z.string().min(1),
        highlights: z.array(z.string()).default([]),
        callouts: z.array(z.string()).default([]),
      }),
    }),
  ])
  .transform((value) => ('current_step_description' in value ? value.current_step_description : value));

export type StepArtifact = z.infer<typeof stepArtifactSchema> & {
  generatedAt: string;
  step: string;
};

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeJsonAtomically(filePath: string, payload: unknown) {
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(payload, null, 2), 'utf8');
  await fs.rename(tempPath, filePath);
}

function buildStepPrompt(step: string, analysis: CaseAnalysis) {
  const shared = {
    case_name: analysis.summary.company,
    summary: analysis.summary,
    key_facts: analysis.keyFacts,
    materials: analysis.materials,
    rules: analysis.rules,
    risks: analysis.risks,
    drafts: analysis.drafts,
    review_summary: analysis.reviewSummary,
  };

  if (step === 'integrity') {
    return {
      roleLabel: '材料完整性检查',
      payload: {
        ...shared,
        instructions: [
          '请为“材料完整性检查”步骤生成当前步骤说明。',
          'summary 只用 1 到 2 句，直接说明这一步的结论，优先回答“材料是否完备”。',
          '如果没有缺失项，就明确写出“核心材料已识别齐全”或等价表达。',
          'highlights 最多输出 2 条，内容应是短标签，例如“核心材料已齐全”“存在同项多份”。',
          'callouts 输出空数组，不要展开成长列表。',
          '只返回 JSON。',
        ],
      },
    };
  }

  if (step === 'verify') {
    return {
      roleLabel: '一致性核验与规则校验',
      payload: {
        ...shared,
        instructions: [
          '请为“一致性核验与规则校验”步骤生成当前步骤说明。',
          'summary 只用 1 到 2 句，概括字段一致性、金额计算和最重要的待确认点。',
          'highlights 最多输出 2 条，内容要短。',
          'callouts 输出空数组。',
          '不要输出空泛术语，内容必须让业务人员直接看懂。',
          '只返回 JSON。',
        ],
      },
    };
  }

  if (step === 'document') {
    return {
      roleLabel: '报告生成',
      payload: {
        ...shared,
        instructions: [
          '请为“报告生成”步骤生成当前步骤说明。',
          'summary 只用 1 到 2 句，说明三份报告已基于前序审查结果生成，目前处于可预览、可重生成、待人工复核状态。',
          'highlights 最多输出 2 条，内容要短。',
          'callouts 输出空数组。',
          '不要把报告说成最终结论，要保留人工复核语气。',
          '只返回 JSON。',
        ],
      },
    };
  }

  return {
    roleLabel: '复核与提交 OA',
    payload: {
      ...shared,
      instructions: [
        '请为“人工复核与提交 OA”步骤生成当前步骤说明。',
        'summary 只用 1 到 2 句，说明当前是否建议提交 OA。',
        'highlights 最多输出 2 条，写明进入 OA 前最重要的判断依据。',
        'callouts 输出空数组。',
        '语言要正式、克制、适合演示给业务人员和管理层。',
        '只返回 JSON。',
      ],
    },
  };
}

export async function getStepArtifact(step: string, analysis: CaseAnalysis, options: { refresh?: boolean } = {}) {
  await ensureDir(STEP_CACHE_ROOT);
  const signatureSeed = JSON.stringify({
    version: STEP_ARTIFACT_VERSION,
    step,
    materials: analysis.materials,
    rules: analysis.rules,
    risks: analysis.risks,
    drafts: analysis.drafts,
    reviewSummary: analysis.reviewSummary,
  });
  const signature = createHash('sha1').update(signatureSeed).digest('hex');
  const cacheFile = path.join(STEP_CACHE_ROOT, `${analysis.summary.id}-${step}-${signature}.json`);

  if (!options.refresh) {
    try {
      const raw = await fs.readFile(cacheFile, 'utf8');
      return JSON.parse(raw) as StepArtifact;
    } catch {}
  }

  const prompt = buildStepPrompt(step, analysis);
  const generated = await blackwhiteJson(
    stepArtifactSchema,
    [
      {
        role: 'system',
        content: `你是担保行业代偿补偿审查专家，熟悉融资担保、再担保、代偿补偿申报、材料完备性审查、一致性核验、证据定位、文书生成和 OA 提交流程。当前任务是为“${prompt.roleLabel}”步骤生成面向业务人员的当前步骤成文说明。必须严格输出 JSON。`,
      },
      {
        role: 'user',
        content: JSON.stringify(prompt.payload, null, 2),
      },
    ],
    { temperature: 0.2 },
  );

  const artifact: StepArtifact = {
    step,
    generatedAt: new Date().toISOString(),
    ...generated,
  };

  await writeJsonAtomically(cacheFile, artifact);
  return artifact;
}
