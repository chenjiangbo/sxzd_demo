import path from 'node:path';
import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { getDemoCacheRoot, getWorkspaceRoot } from '@/lib/server/runtime-root';

const WORKSPACE_ROOT = getWorkspaceRoot();
const COMPENSATION_DOC_DIR = path.join(WORKSPACE_ROOT, 'docs', '代偿补偿');
const COMPENSATION_PROMPT_CONFIG_CACHE = path.join(getDemoCacheRoot(), 'compensation-report', 'prompt-config.json');

const resourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(['template', 'case_cache', 'material', 'rule', 'source']),
  path: z.string().min(1).optional(),
  purpose: z.string().min(1),
});

const compensationPromptConfigSchema = z.object({
  businessRequirements: z.array(z.string().min(1)).min(1),
  technicalRequirements: z.array(z.string().min(1)).min(1),
  templateConstraints: z.array(z.string().min(1)).min(1),
  resources: z.array(resourceSchema).min(1),
});

export type CompensationPromptConfig = z.infer<typeof compensationPromptConfigSchema>;
export type CompensationPromptResource = z.infer<typeof resourceSchema>;

function buildDefaultResources(): CompensationPromptResource[] {
  return [
    {
      id: 'approval-template-pdf',
      title: '代偿补偿审批表样稿',
      kind: 'template',
      path: path.join(COMPENSATION_DOC_DIR, '宝鸡三家村餐饮管理有限公司项目再担保代偿补偿审批表.pdf'),
      purpose: '约束审批表的版式、区块顺序、表格结构和正式审批口径。',
    },
    {
      id: 'case-analysis-cache',
      title: '案件分析缓存',
      kind: 'case_cache',
      purpose: '提供案件主数据、关键事实、材料匹配、规则校验、风险提示和 OA 流程摘要。',
    },
    {
      id: 'material-check-result',
      title: '材料清单匹配结果',
      kind: 'material',
      purpose: '提供每项材料的匹配状态、对应文件、AI 判断说明和人工关注项。',
    },
    {
      id: 'rule-check-result',
      title: '一致性与规则校验结果',
      kind: 'rule',
      purpose: '提供合同号、金额、日期、比例和待确认规则的校验结论。',
    },
    {
      id: 'source-package',
      title: '原始申报材料与台账',
      kind: 'source',
      path: path.join(COMPENSATION_DOC_DIR, '宝鸡三家村餐饮管理有限公司申报材料'),
      purpose: '作为案件缓存的原始来源，包括 PDF 材料、备案数据和解保台账。',
    },
  ];
}

export function getDefaultCompensationPromptConfig(): CompensationPromptConfig {
  return {
    businessRequirements: [
      '审批表必须是正式的再担保代偿补偿审批表，不是普通报告或聊天回复。',
      '必须严格基于输入数据，不得编造事实、金额、合同号、业务编号和结论。',
      '对于需要人工确认的内容，必须在具体文本里写出【人工复核】。',
      '一、债务人基本情况优先写成 1 段主体画像说明，必要时补 1 段经营情况说明。',
      '四、备案情况需要明确“首次备案”“展期续备案”“当前备案确认”的时间与关系。',
      '五、代偿原因需要说明企业经营情况导致代偿，以及代偿证明或付款凭证对应的代偿金额。',
      '七、追偿方案需要写明确的追偿方式和计划，不要只写“建议进入 OA 流程”。',
      '结论请尽量贴近正式审批口径，例如“经审查，该项目符合我司代偿补偿条件，建议对该项目进行代偿补偿，我司需补偿XXX元。”',
      '金额、比例、合同号、业务编号必须与输入数据一致。',
      '结论必须与当前规则结果一致。',
    ],
    technicalRequirements: [
      '只返回 JSON，不要输出 markdown，不要输出解释。',
      '输出必须严格匹配 output_schema。',
      'borrowRows 必须输出为数组，每项包含 index、item、content。',
      'riskRows 必须输出为数组，每项包含 compensationDate、uncompensatedPrincipal、indemnityAmount、ratio、compensationAmount。',
      '不得输出 **、#、-、``` 等 markdown 符号。',
    ],
    templateConstraints: [
      '标题固定为“宝鸡三家村餐饮管理有限公司项目再担保代偿补偿审批表”。',
      'header.guarantorName 必须写担保机构名称，header.date 必须写审批表日期。',
      '页面结构必须尽量贴近原审批表：标题、担保机构名称、日期、左侧纵向栏、各业务区块、表格、结论。',
      'borrowRows 必须严格按“序号 / 项目 / 内容”结构输出，不要合并成段落。',
      'borrowRows 的项目字段优先对齐审批表常见行：债权人、主债权金额、担保费率、借款合同号、保证合同号、委保合同号、主债权起始日期、主债权到期日期。',
      'riskRows 的列含义固定为：代偿时间、债务人未清偿本金、原担保机构代偿金额、省级再担责任比例、省级再担代偿补偿金额。',
      '整体版式请尽量贴近正式审批表，而不是普通报告：正文应以短段落和表格行为主，不要输出散文化长篇论述。',
    ],
    resources: buildDefaultResources(),
  };
}

async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function getCompensationPromptConfig() {
  try {
    const raw = await fs.readFile(COMPENSATION_PROMPT_CONFIG_CACHE, 'utf8');
    return compensationPromptConfigSchema.parse(JSON.parse(raw));
  } catch {
    return getDefaultCompensationPromptConfig();
  }
}

export async function saveCompensationPromptConfig(config: CompensationPromptConfig) {
  const parsed = compensationPromptConfigSchema.parse(config);
  await ensureDir(COMPENSATION_PROMPT_CONFIG_CACHE);
  await fs.writeFile(COMPENSATION_PROMPT_CONFIG_CACHE, JSON.stringify(parsed, null, 2), 'utf8');
  return parsed;
}
