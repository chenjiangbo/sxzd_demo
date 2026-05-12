import path from 'node:path';
import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { getDemoCacheRoot, getWorkspaceRoot } from '@/lib/server/runtime-root';

const WORKSPACE_ROOT = getWorkspaceRoot();
const EVALUATION_DOC_DIR = path.join(WORKSPACE_ROOT, 'docs', '机构评价');
const EVALUATION_PROMPT_CONFIG_CACHE = path.join(getDemoCacheRoot(), 'evaluation-report', 'prompt-config.json');

const resourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(['template', 'data', 'structured']),
  path: z.string().min(1).optional(),
  purpose: z.string().min(1),
});

const evaluationPromptConfigSchema = z.object({
  businessRequirements: z.array(z.string().min(1)).min(1),
  technicalRequirements: z.array(z.string().min(1)).min(1),
  templateConstraints: z.array(z.string().min(1)).min(1),
  resources: z.array(resourceSchema).min(1),
});

export type EvaluationPromptConfig = z.infer<typeof evaluationPromptConfigSchema>;
export type EvaluationPromptResource = z.infer<typeof resourceSchema>;

function buildDefaultResources(): EvaluationPromptResource[] {
  return [
    {
      id: 'evaluation-template-qujiang',
      title: '机构评价报告模板（曲江担保）',
      kind: 'template',
      path: path.join(EVALUATION_DOC_DIR, '保后评价报告-曲江担保.docx'),
      purpose: '约束报告的表格版式、标题层级、字体风格和分页结构。',
    },
    {
      id: 'evaluation-template-xiancaijin',
      title: '机构评价报告样稿（西安财金担保）',
      kind: 'template',
      path: path.join(EVALUATION_DOC_DIR, '保后评价报告-西安财金担保.docx'),
      purpose: '补充经营分析、政策目标分析和结论段的正式行文风格。',
    },
    {
      id: 'evaluation-spreadsheet',
      title: '机构评价统计表',
      kind: 'data',
      path: path.join(EVALUATION_DOC_DIR, 'evaluation-report-2026-04-01.xls'),
      purpose: '提供机构 8 项核心指标、目标值、实际值和完成率。',
    },
    {
      id: 'evaluation-system-sheet',
      title: '体系机构评价原始台账',
      kind: 'data',
      path: path.join(EVALUATION_DOC_DIR, '体系机构评价报告(2026-03-31).xls'),
      purpose: '补充体系内机构评价明细和报表来源说明。',
    },
    {
      id: 'evaluation-structured-summary',
      title: '结构化机构指标摘要',
      kind: 'structured',
      purpose: '提供机构名称、区域层级、综合评价和 8 项指标的结构化摘要，避免模型直接读取原始 Excel。',
    },
    {
      id: 'evaluation-structured-render',
      title: '结构化版式约束',
      kind: 'structured',
      purpose: '提供封面、章节结构、政策表格和业务结构表的固定渲染骨架。',
    },
  ];
}

export function getDefaultEvaluationPromptConfig(): EvaluationPromptConfig {
  return {
    businessRequirements: [
      '报告必须是正式的政府性融资担保机构综合评价报告，不是聊天回复或自由文稿。',
      '内容必须严格基于输入机构指标，不得编造未提供的事实、数字、机构背景和结论。',
      '“一、经营情况变化及分析”应重点围绕机构基本经营变化、股权或评级变化、在保余额和净资产等可确认事实展开。',
      '“二、年度政策目标完成情况”必须围绕 8 项核心指标展开，不得脱离指标另写无关分析。',
      '“三、授信使用及业务开展”允许引用授信、代偿返还等已有信息；如果业务分类明细缺失，必须明确说明待补充，不得虚构。',
      '“四、结论”必须给出明确评价结论，并与综合评价结果保持一致。',
      '语言风格必须正式、审慎、接近国企公文。',
      '正文段落应简洁、克制，以便直接填入固定模板，不要写成长篇散文。',
    ],
    technicalRequirements: [
      '只返回 JSON，不要输出 markdown、HTML、解释或代码块。',
      '输出必须严格匹配 output_schema。',
      'businessAnalysisParagraphs、annualTargetAnalysisParagraphs、creditUsageParagraphs、conclusionParagraphs 都必须返回非空数组。',
      'annualTargetLead 必须返回单独一句导语。',
      '不得输出标题页、附件列表或版式说明文字。',
    ],
    templateConstraints: [
      '标题固定为“陕西省政府性融资担保机构综合评价报告”。',
      '正文固定为四个一级部分：一、经营情况变化及分析；二、年度政策目标完成情况；三、授信使用及业务开展；四、结论。',
      '第二部分必须先写导语，再承接年度政策目标表格后的分析段落。',
      '第三部分默认保留业务结构表骨架，因此正文只需输出表格前后的分析段落，不要在正文中重复造表。',
      '整体格式需要适配既有 Word 模板的灰底章节栏和表格化排版，不要输出口语化小标题。',
    ],
    resources: buildDefaultResources(),
  };
}

async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function getEvaluationPromptConfig() {
  try {
    const raw = await fs.readFile(EVALUATION_PROMPT_CONFIG_CACHE, 'utf8');
    return evaluationPromptConfigSchema.parse(JSON.parse(raw));
  } catch {
    return getDefaultEvaluationPromptConfig();
  }
}

export async function saveEvaluationPromptConfig(config: EvaluationPromptConfig) {
  const parsed = evaluationPromptConfigSchema.parse(config);
  await ensureDir(EVALUATION_PROMPT_CONFIG_CACHE);
  await fs.writeFile(EVALUATION_PROMPT_CONFIG_CACHE, JSON.stringify(parsed, null, 2), 'utf8');
  return parsed;
}
