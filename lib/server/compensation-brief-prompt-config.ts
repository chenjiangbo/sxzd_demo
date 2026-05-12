import path from 'node:path';
import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { getDemoCacheRoot, getWorkspaceRoot } from '@/lib/server/runtime-root';

const WORKSPACE_ROOT = getWorkspaceRoot();
const COMPENSATION_BRIEF_PROMPT_CONFIG_CACHE = path.join(getDemoCacheRoot(), 'compensation-brief', 'prompt-config.json');

const resourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(['template', 'data', 'structured']),
  path: z.string().min(1).optional(),
  purpose: z.string().min(1),
});

const compensationBriefPromptConfigSchema = z.object({
  businessRequirements: z.array(z.string().min(1)).min(1),
  technicalRequirements: z.array(z.string().min(1)).min(1),
  templateConstraints: z.array(z.string().min(1)).min(1),
  resources: z.array(resourceSchema).min(1),
});

export type CompensationBriefPromptConfig = z.infer<typeof compensationBriefPromptConfigSchema>;
export type CompensationBriefPromptResource = z.infer<typeof resourceSchema>;

function buildDefaultResources(): CompensationBriefPromptResource[] {
  return [
    {
      id: 'comp-brief-template-html',
      title: '代偿补偿简报渲染模板',
      kind: 'template',
      path: path.join(WORKSPACE_ROOT, 'templates', 'compensation-template.html'),
      purpose: '约束简报标题、摘要区块、银行分类表格和附表版式。',
    },
    {
      id: 'comp-brief-mapping-json',
      title: '代偿补偿映射数据',
      kind: 'data',
      path: path.join(WORKSPACE_ROOT, 'data', 'compensation-mapping.json'),
      purpose: '提供年度代偿补偿简报的摘要指标、银行分类和统计字段。',
    },
    {
      id: 'comp-brief-filing-xlsx',
      title: '备案台账样本',
      kind: 'data',
      path: path.join(WORKSPACE_ROOT, 'docs', '代偿补偿', '宝鸡三家村餐饮管理有限公司申报材料', 'tmp备案数据_1772420814804.xlsx'),
      purpose: '补充说明代偿补偿业务来源和备案口径。',
    },
    {
      id: 'comp-brief-release-xlsx',
      title: '解保台账样本',
      kind: 'data',
      path: path.join(WORKSPACE_ROOT, 'docs', '代偿补偿', '宝鸡三家村餐饮管理有限公司申报材料', 'tmp解保台账数据_1772421102442.xlsx'),
      purpose: '补充说明代偿补偿金额、解保时间和责任分摊来源。',
    },
    {
      id: 'comp-brief-structured',
      title: '代偿补偿结构化摘要',
      kind: 'structured',
      purpose: '提供按银行类别、金额占比、笔数占比和代偿率整理后的结构化摘要，便于生成简报结论。',
    },
  ];
}

export function getDefaultCompensationBriefPromptConfig(): CompensationBriefPromptConfig {
  return {
    businessRequirements: [
      '简报必须是正式的代偿补偿业务统计简报，不是聊天回复或自由文稿。',
      '内容应重点概括年度代偿补偿规模、银行分类表现、金额占比和代偿率等关键业务结论。',
      '摘要部分应先给出总体判断，再分银行类别和风险情况进行说明。',
      '表格区块应与既有模板保持一致，重点展示补偿金额、金额占比、笔数、笔均和合作业务代偿率。',
      '涉及金额、比例、笔数和银行分类的描述必须与映射数据一致，不得编造。',
      '语言风格应正式、简洁，适合内部简报和经营分析场景。',
    ],
    technicalRequirements: [
      '输出仅用于页面演示，不展示给最终客户。',
      '生成结果需要适配固定 HTML 模板和预定义表格骨架。',
    ],
    templateConstraints: [
      '标题固定为年度代偿补偿简报，正文包含年度概览、分类分析和附表区块。',
      '合作银行应按国有大型银行、全国股份制银行、地方法人银行、互联网银行等分类展示。',
      '摘要中的关键结论必须能在下方表格找到支撑字段。',
      '整体版式应接近内部业务通报，不要写成审批表或案例报告。',
    ],
    resources: buildDefaultResources(),
  };
}

async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function getCompensationBriefPromptConfig() {
  try {
    const raw = await fs.readFile(COMPENSATION_BRIEF_PROMPT_CONFIG_CACHE, 'utf8');
    return compensationBriefPromptConfigSchema.parse(JSON.parse(raw));
  } catch {
    return getDefaultCompensationBriefPromptConfig();
  }
}

export async function saveCompensationBriefPromptConfig(config: CompensationBriefPromptConfig) {
  const parsed = compensationBriefPromptConfigSchema.parse(config);
  await ensureDir(COMPENSATION_BRIEF_PROMPT_CONFIG_CACHE);
  await fs.writeFile(COMPENSATION_BRIEF_PROMPT_CONFIG_CACHE, JSON.stringify(parsed, null, 2), 'utf8');
  return parsed;
}
