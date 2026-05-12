import path from 'node:path';
import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { getDemoCacheRoot, getWorkspaceRoot } from '@/lib/server/runtime-root';

const WORKSPACE_ROOT = getWorkspaceRoot();
const BRIEF_PROMPT_CONFIG_CACHE = path.join(getDemoCacheRoot(), 'brief', 'prompt-config.json');

const resourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(['template', 'data', 'structured']),
  path: z.string().min(1).optional(),
  purpose: z.string().min(1),
});

const briefPromptConfigSchema = z.object({
  businessRequirements: z.array(z.string().min(1)).min(1),
  technicalRequirements: z.array(z.string().min(1)).min(1),
  templateConstraints: z.array(z.string().min(1)).min(1),
  resources: z.array(resourceSchema).min(1),
});

export type BriefPromptConfig = z.infer<typeof briefPromptConfigSchema>;
export type BriefPromptResource = z.infer<typeof resourceSchema>;

function buildDefaultResources(): BriefPromptResource[] {
  return [
    {
      id: 'brief-template-docx',
      title: '担保业务简报模板',
      kind: 'template',
      path: path.join(WORKSPACE_ROOT, 'data', 'GuaranteeBusinessTemplate.docx'),
      purpose: '约束简报标题、段落结构、表格顺序和正式成文风格。',
    },
    {
      id: 'brief-template-html',
      title: '担保业务简报渲染模板',
      kind: 'template',
      path: path.join(WORKSPACE_ROOT, 'templates', 'brief-template.html'),
      purpose: '约束页面预览中的表格区块、摘要段落和附表呈现形式。',
    },
    {
      id: 'brief-table-csv',
      title: '担保业务统计表',
      kind: 'data',
      path: path.join(WORKSPACE_ROOT, 'data', 'GuaranteeBusinessBriefTableData.csv'),
      purpose: '提供 12 张业务统计表的原始行列数据，作为简报正文和附表的基础来源。',
    },
    {
      id: 'brief-table-json',
      title: '担保业务表格结构化摘要',
      kind: 'structured',
      path: path.join(WORKSPACE_ROOT, 'data', 'brief-tables.json'),
      purpose: '提供按表格分组后的结构化摘要，便于生成导语和关键结论。',
    },
    {
      id: 'brief-template-guide',
      title: '简报模板说明',
      kind: 'structured',
      path: path.join(WORKSPACE_ROOT, 'data', 'TEMPLATE_GUIDE.md'),
      purpose: '补充说明表格映射规则、模板口径和字段替换方式。',
    },
  ];
}

export function getDefaultBriefPromptConfig(): BriefPromptConfig {
  return {
    businessRequirements: [
      '简报必须是正式的担保业务统计简报，不是聊天回复或自由文稿。',
      '内容必须围绕担保规模、合作机构、合作银行、分险业务、综合融资成本等核心指标展开，避免写成单一表格说明。',
      '摘要部分应先给出整体判断，再分别概括主要业务亮点和风险提示。',
      '各表格的表题、顺序和口径应与 12 张业务统计表保持一致，不得随意更换顺序。',
      '涉及金额、占比、笔数、费率的描述必须与输入表格一致，不得编造。',
      '语言风格应正式、简洁，适合业务简报和汇报场景。',
    ],
    technicalRequirements: [
      '输出仅用于页面演示，不展示给最终客户。',
      '生成结果需要适配固定 HTML/Word 模板的结构化排版。',
    ],
    templateConstraints: [
      '标题固定为年度担保业务简报，正文包含概览、摘要和附表区块。',
      '12 张业务统计表必须按既有顺序展示，并保留中文表题。',
      '重点数据应优先在摘要中出现，再由附表承接完整明细。',
      '整体版式应接近正式内部通报，而不是分析报告或审批材料。',
    ],
    resources: buildDefaultResources(),
  };
}

async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function getBriefPromptConfig() {
  try {
    const raw = await fs.readFile(BRIEF_PROMPT_CONFIG_CACHE, 'utf8');
    return briefPromptConfigSchema.parse(JSON.parse(raw));
  } catch {
    return getDefaultBriefPromptConfig();
  }
}

export async function saveBriefPromptConfig(config: BriefPromptConfig) {
  const parsed = briefPromptConfigSchema.parse(config);
  await ensureDir(BRIEF_PROMPT_CONFIG_CACHE);
  await fs.writeFile(BRIEF_PROMPT_CONFIG_CACHE, JSON.stringify(parsed, null, 2), 'utf8');
  return parsed;
}
