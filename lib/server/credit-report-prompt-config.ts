import path from 'node:path';
import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { getDemoCacheRoot, getWorkspaceRoot } from '@/lib/server/runtime-root';

const WORKSPACE_ROOT = getWorkspaceRoot();
const CREDIT_DOC_DIR = path.join(WORKSPACE_ROOT, 'docs', '授信及评价');
const CREDIT_PROMPT_CONFIG_CACHE = path.join(getDemoCacheRoot(), 'credit-report', 'prompt-config.json');

const resourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(['template', 'policy', 'data', 'structured']),
  path: z.string().min(1).optional(),
  purpose: z.string().min(1),
});

const creditPromptConfigSchema = z.object({
  businessRequirements: z.array(z.string().min(1)).min(1),
  technicalRequirements: z.array(z.string().min(1)).min(1),
  templateConstraints: z.array(z.string().min(1)).min(1),
  resources: z.array(resourceSchema).min(1),
});

export type CreditPromptConfig = z.infer<typeof creditPromptConfigSchema>;
export type CreditPromptResource = z.infer<typeof resourceSchema>;

function buildDefaultResources(): CreditPromptResource[] {
  return [
    {
      id: 'template-report-doc',
      title: '授信报告样稿',
      kind: 'template',
      path: path.join(CREDIT_DOC_DIR, '副本关于2025年度合作担保机构再担保业务授信的报告(1).docx'),
      purpose: '约束授信报告的结构、语气、标题层级和落款格式。',
    },
    {
      id: 'policy-pdf',
      title: '授信管理办法',
      kind: 'policy',
      path: path.join(CREDIT_DOC_DIR, '陕西省信用再担保有限责任公司再担保业务授信管理办法.pdf'),
      purpose: '提供授信规则、评价指标、分险口径和审批流程依据。',
    },
    {
      id: 'credit-statistics-xlsx',
      title: '合作担保机构授信情况统计表',
      kind: 'data',
      path: path.join(CREDIT_DOC_DIR, '副本2025年合作担保机构授信情况统计表.xlsx'),
      purpose: '提供合作机构授信测算、分组结果和额度明细的基础数据。',
    },
    {
      id: 'evaluation-sample-doc',
      title: '机构评价样本',
      kind: 'data',
      path: path.join(CREDIT_DOC_DIR, '副本14.机构评价报告-业务一部-季度.doc'),
      purpose: '补充机构评价口径、样例结论和辅助说明素材。',
    },
    {
      id: 'structured-stats',
      title: '结构化统计摘要',
      kind: 'structured',
      purpose: '提供 stats、summary、groups 等结构化授信汇总数据，避免模型直接读取原始 Excel。',
    },
    {
      id: 'structured-sources',
      title: '结构化来源索引',
      kind: 'structured',
      purpose: '提供 sourceCatalog、sourceIndex 作为数字溯源依据，支持 data_trace 输出。',
    },
  ];
}

export function getDefaultCreditPromptConfig(): CreditPromptConfig {
  return {
    businessRequirements: [
      '报告必须是正式授信报告，不是聊天回复或自由文稿。',
      '必须严格参照既有授信报告样稿的结构、语气、标题层级和公文写法。',
      '正文必须包含固定结构：标题、称谓、引言、一、综合授信情况、二、产品分项额度设定、三、授信额度运用、附件行、落款部门、落款日期。',
      '文中金额、机构数量、机构分组、产品额度等必须与输入数据一致。',
      '不得编造任何数字、机构名称、政策依据和附件名称。',
      '附件行必须单独成段，写为“附件：2025年度合作担保机构再担保业务授信情况统计表”。',
      '落款必须以“业务一部”和当前时间（到日）两行结束。',
      '语言风格必须正式、克制、适合国企公文成文场景。',
    ],
    technicalRequirements: [
      '输出必须是 JSON。',
      '正式成文只能放在 report_text 字段中。',
      '不得输出 markdown、解释性说明、代码块或列表标记。',
      '必须同时输出 data_trace，用于标识关键数字的来源与口径。',
      'data_trace.sourceType 只能是 direct 或 derived。',
      'data_trace.sourceIds 必须从 sourceIndex 或 sourceCatalog 中逐字引用，不得编造路径。',
    ],
    templateConstraints: [
      '标题固定为“2025年度合作担保机构再担保业务授信报告”。',
      '称谓固定为“公司领导：”。',
      '一级标题必须使用“一、”“二、”“三、”格式，小条款使用“（一）”“（二）”格式。',
      '附件、落款部门、落款日期必须按既有样稿位置和形式出现。',
    ],
    resources: buildDefaultResources(),
  };
}

async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function getCreditPromptConfig() {
  try {
    const raw = await fs.readFile(CREDIT_PROMPT_CONFIG_CACHE, 'utf8');
    return creditPromptConfigSchema.parse(JSON.parse(raw));
  } catch {
    return getDefaultCreditPromptConfig();
  }
}

export async function saveCreditPromptConfig(config: CreditPromptConfig) {
  const parsed = creditPromptConfigSchema.parse(config);
  await ensureDir(CREDIT_PROMPT_CONFIG_CACHE);
  await fs.writeFile(CREDIT_PROMPT_CONFIG_CACHE, JSON.stringify(parsed, null, 2), 'utf8');
  return parsed;
}

export async function resetCreditPromptConfig() {
  await fs.rm(CREDIT_PROMPT_CONFIG_CACHE, { force: true });
  return getDefaultCreditPromptConfig();
}
