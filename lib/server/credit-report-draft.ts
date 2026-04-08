import path from 'node:path';
import { promises as fs } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';
import { GeneratedCreditReport, normalizeCreditReportText, parseCreditReportText } from '@/lib/credit-report-format';
import { blackwhiteJson, type ChatMessage } from '@/lib/server/blackwhite';
import { getDemoCacheRoot, getWorkspaceRoot } from '@/lib/server/runtime-root';
import { getCreditReportData } from '@/lib/server/credit-report';

const execFileAsync = promisify(execFile);

const WORKSPACE_ROOT = getWorkspaceRoot();
const CREDIT_DOC_DIR = path.join(WORKSPACE_ROOT, 'docs', '授信及评价');
const CREDIT_REPORT_TEMPLATE_DOC = path.join(CREDIT_DOC_DIR, '副本关于2025年度合作担保机构再担保业务授信的报告(1).docx');
const GENERATED_REPORT_CACHE = path.join(getDemoCacheRoot(), 'credit-report', 'generated-report.json');

const traceItemSchema = z.object({
  id: z.string().min(1),
  numberText: z.string().min(1),
  semanticLabel: z.string().min(1),
  sourceType: z.enum(['direct', 'derived']),
  sourceIds: z.array(z.string().min(1)).min(1),
  formula: z.string().optional(),
  note: z.string().optional(),
});

const generatedCreditReportSchema = z.object({
  rawText: z.string().min(1),
  generatedAt: z.string().min(1),
  dataTrace: z.array(traceItemSchema).default([]),
});

const generatedCreditReportWithTraceSchema = z.object({
  report_text: z.string().min(1),
  data_trace: z.array(traceItemSchema).default([]),
});

export type CreditTraceItem = z.infer<typeof traceItemSchema>;
export type GeneratedCreditReportWithTrace = z.infer<typeof generatedCreditReportSchema>;

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readTemplateText() {
  const { stdout } = await execFileAsync('textutil', ['-convert', 'txt', '-stdout', CREDIT_REPORT_TEMPLATE_DOC], {
    timeout: 120_000,
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  });
  return stdout.trim();
}

function buildPromptPayload(data: Awaited<ReturnType<typeof getCreditReportData>>) {
  const sourceCatalog = {
    stats: [
      { id: 'stats.institutionCount', label: '合作机构数量', value: data.stats.institutionCount, unit: '家' },
      { id: 'stats.applicationTotal', label: '申请总额', value: data.stats.applicationTotal, unit: '亿元' },
      { id: 'stats.grantedTotal', label: '拟授信总额', value: data.stats.grantedTotal, unit: '亿元' },
      { id: 'stats.riskCreditTotal', label: '银担分险额度', value: data.stats.riskCreditTotal, unit: '亿元' },
      { id: 'stats.nonRiskCreditTotal', label: '非银担分险额度', value: data.stats.nonRiskCreditTotal, unit: '亿元' },
      { id: 'stats.soeCreditTotal', label: '国企担保贷款额度', value: data.stats.soeCreditTotal, unit: '亿元' },
    ],
    groups: data.groups.map((group) => ({
      id: `groups.${group.key}.totalCredit`,
      label: `${group.title}合计`,
      value: group.totalCredit,
      unit: '亿元',
      countId: `groups.${group.key}.count`,
      countValue: group.count,
      memberIds: group.members.map((member) => `institutions.${member.id}.totalCredit`),
    })),
    institutions: data.institutions.map((item) => ({
      id: item.id,
      name: item.name,
      values: [
        { id: `institutions.${item.id}.scale2024`, label: '2024备案规模', value: item.scale2024, unit: '亿元' },
        { id: `institutions.${item.id}.factor`, label: '额度系数', value: item.factor, unit: '' },
        { id: `institutions.${item.id}.growthRate`, label: '再担保增长率', value: item.growthRate, unit: '' },
        { id: `institutions.${item.id}.totalCredit`, label: '总授信额度', value: item.totalCredit, unit: '亿元' },
        { id: `institutions.${item.id}.soeCredit`, label: '国企额度', value: item.soeCredit, unit: '亿元' },
        { id: `institutions.${item.id}.nonRiskCredit`, label: '非分险额度', value: item.nonRiskCredit, unit: '亿元' },
        { id: `institutions.${item.id}.riskCredit`, label: '分险额度', value: item.riskCredit, unit: '亿元' },
      ],
    })),
  };
  const sourceIndex = [
    ...sourceCatalog.stats.map((item) => ({ id: item.id, label: item.label, value: item.value, unit: item.unit })),
    ...sourceCatalog.groups.flatMap((item) => [
      { id: item.id, label: item.label, value: item.value, unit: item.unit },
      { id: item.countId, label: `${item.label}机构数量`, value: item.countValue, unit: '家' },
    ]),
    ...sourceCatalog.institutions.flatMap((institution) =>
      institution.values.map((item) => ({
        id: item.id,
        label: `${institution.name}${item.label}`,
        value: item.value,
        unit: item.unit,
      })),
    ),
    { id: 'summary.executionNotes[0]', label: '非银担分险额度压降比例说明', value: data.summary.executionNotes[0] ?? '', unit: '' },
    { id: 'summary.executionNotes[1]', label: '国企担保贷款比例说明', value: data.summary.executionNotes[1] ?? '', unit: '' },
  ];

  return {
    stats: data.stats,
    summary: data.summary,
    groups: data.groups.map((group) => ({
      key: group.key,
      title: group.title,
      count: group.count,
      totalCredit: group.totalCredit,
      summary: group.summary,
      decisionBasis: group.decisionBasis,
      members: group.members.map((member) => member.shortName),
    })),
    institutions: data.institutions.map((item) => ({
      name: item.name,
      shortName: item.shortName,
      regionLevel: item.regionLevel,
      displayLabel: item.displayLabel,
      rating: item.rating,
      totalCredit: item.totalCredit,
      nonRiskCredit: item.nonRiskCredit,
      riskCredit: item.riskCredit,
      soeCredit: item.soeCredit,
      scale2024: item.scale2024,
      growthRate: item.growthRate,
    })),
    reportMeta: {
      title: '2025年度合作担保机构再担保业务授信报告',
      addressee: '公司领导：',
      signatureDepartment: '业务一部',
      signatureDate: '2025年5月22日',
      attachmentLine: '附件：2025年度合作担保机构再担保业务授信情况统计表',
    },
    sourceCatalog,
    sourceIndex,
  };
}

export async function buildCreditReportMessages(): Promise<ChatMessage[]> {
  const [data, templateText] = await Promise.all([getCreditReportData(), readTemplateText()]);
  const promptPayload = buildPromptPayload(data);

  return [
    {
      role: 'system',
      content: [
        '你是一名国企公文写作助手，负责撰写正式授信报告。',
        '你必须严格遵循模板的结构、语气、标题层级和公文写法。',
        '你的输出必须是 JSON，对外正式成文只能放在 report_text 字段中，不输出额外解释，不输出 markdown。',
        '必须严格使用提供的数据，不得编造任何数字、机构名称、政策依据和附件名称。',
        '报告正文必须包含且只包含以下结构：标题、称谓、引言、一、综合授信情况、二、产品分项额度设定、三、授信额度运用、附件行、落款部门、落款日期。',
        '一级标题必须使用“一、”“二、”“三、”格式，小条款使用“（一）”“（二）”格式。',
        'report_text 必须是适合直接展示和导出 Word 的正式正文，段落之间使用换行分隔。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        '以下是必须严格参照的模板全文，请学习其语气、段落组织方式和章节安排：',
        templateText,
        '',
        '以下是本次报告允许使用的真实数据，请严格基于这些数据写作：',
        JSON.stringify(promptPayload, null, 2),
        '',
        '输出要求：',
        '1. 第一行固定输出“2025年度合作担保机构再担保业务授信报告”。',
        '2. 第二行固定输出“公司领导：”。',
        '3. 文中金额、机构数量、机构分组、产品额度等必须和提供数据一致。',
        '4. 保留正式公文措辞，不要写提示语，不要写代码块，不要写列表标记符号。',
        '5. 最后必须以“业务一部”和“2025年5月22日”作为落款两行结束。',
        '6. 附件行必须单独成段，写为“附件：2025年度合作担保机构再担保业务授信情况统计表”。',
        '7. 最终只输出 JSON，JSON 结构必须是：{ "report_text": string, "data_trace": Array<{ id, numberText, semanticLabel, sourceType, sourceIds, formula?, note? }> }。',
        '8. report_text 中禁止出现来源解释、公式、字段 id 或括号式技术说明。',
        '9. data_trace 中 sourceType 只能填写 "direct" 或 "derived"，绝对不能输出 literal、source、estimated、inferred 等其他值。',
        '10. data_trace 的 sourceIds 必须从 sourceIndex 或 sourceCatalog 中逐字复制，不能改写为 institutions[3].totalCredit 这类路径，不能编造不存在的 id。',
        '11. 如果数字是直接引用基础数据，则 sourceType = "direct"；如果数字由基础数据加总、相减、占比、压降等得出，则 sourceType = "derived"，并填写 formula。',
        '12. data_trace 重点覆盖正文中实际出现的金额、机构数、分组合计和机构额度数字。',
        '13. 示例：{"id":"trace-granted-total","numberText":"451.3亿元","semanticLabel":"拟授信总额","sourceType":"direct","sourceIds":["stats.grantedTotal"]}',
        '14. 示例：{"id":"trace-risk-share","numberText":"81.46%","semanticLabel":"银担分险授信额度占比","sourceType":"derived","sourceIds":["stats.riskCreditTotal","stats.grantedTotal"],"formula":"stats.riskCreditTotal / stats.grantedTotal"}',
      ].join('\n'),
    },
  ];
}

function collectValidSourceIds(promptPayload: ReturnType<typeof buildPromptPayload>) {
  return new Set(promptPayload.sourceIndex.map((item) => item.id));
}

function validateGeneratedTrace(
  generated: z.infer<typeof generatedCreditReportWithTraceSchema>,
  validSourceIds: Set<string>,
) {
  const invalidEntries = generated.data_trace
    .map((item, index) => ({
      index,
      id: item.id,
      invalidSourceIds: item.sourceIds.filter((sourceId) => !validSourceIds.has(sourceId)),
    }))
    .filter((item) => item.invalidSourceIds.length > 0);

  if (invalidEntries.length > 0) {
    throw new Error(
      `模型返回了未定义的 sourceIds: ${JSON.stringify(
        invalidEntries.map((item) => ({
          index: item.index,
          id: item.id,
          invalidSourceIds: item.invalidSourceIds,
        })),
      )}`,
    );
  }
}

export async function generateCreditReportWithTrace() {
  const [data, templateText] = await Promise.all([getCreditReportData(), readTemplateText()]);
  const promptPayload = buildPromptPayload(data);
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: [
        '你是一名国企公文写作助手，负责撰写正式授信报告。',
        '你必须严格遵循模板的结构、语气、标题层级和公文写法。',
        '你的输出必须是 JSON，对外正式成文只能放在 report_text 字段中，不输出额外解释，不输出 markdown。',
        '必须严格使用提供的数据，不得编造任何数字、机构名称、政策依据和附件名称。',
        '报告正文必须包含且只包含以下结构：标题、称谓、引言、一、综合授信情况、二、产品分项额度设定、三、授信额度运用、附件行、落款部门、落款日期。',
        '一级标题必须使用“一、”“二、”“三、”格式，小条款使用“（一）”“（二）”格式。',
        'report_text 必须是适合直接展示和导出 Word 的正式正文，段落之间使用换行分隔。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        '以下是必须严格参照的模板全文，请学习其语气、段落组织方式和章节安排：',
        templateText,
        '',
        '以下是本次报告允许使用的真实数据，请严格基于这些数据写作：',
        JSON.stringify(promptPayload, null, 2),
        '',
        '输出要求：',
        '1. 第一行固定输出“2025年度合作担保机构再担保业务授信报告”。',
        '2. 第二行固定输出“公司领导：”。',
        '3. 文中金额、机构数量、机构分组、产品额度等必须和提供数据一致。',
        '4. 保留正式公文措辞，不要写提示语，不要写代码块，不要写列表标记符号。',
        '5. 最后必须以“业务一部”和“2025年5月22日”作为落款两行结束。',
        '6. 附件行必须单独成段，写为“附件：2025年度合作担保机构再担保业务授信情况统计表”。',
        '7. 最终只输出 JSON，JSON 结构必须是：{ "report_text": string, "data_trace": Array<{ id, numberText, semanticLabel, sourceType, sourceIds, formula?, note? }> }。',
        '8. report_text 中禁止出现来源解释、公式、字段 id 或括号式技术说明。',
        '9. data_trace 中 sourceType 只能填写 "direct" 或 "derived"，绝对不能输出 literal、source、estimated、inferred 等其他值。',
        '10. data_trace 的 sourceIds 必须从 sourceIndex 或 sourceCatalog 中逐字复制，不能改写为 institutions[3].totalCredit 这类路径，不能编造不存在的 id。',
        '11. 如果数字是直接引用基础数据，则 sourceType = "direct"；如果数字由基础数据加总、相减、占比、压降等得出，则 sourceType = "derived"，并填写 formula。',
        '12. data_trace 重点覆盖正文中实际出现的金额、机构数、分组合计和机构额度数字。',
        '13. 示例：{"id":"trace-granted-total","numberText":"451.3亿元","semanticLabel":"拟授信总额","sourceType":"direct","sourceIds":["stats.grantedTotal"]}',
        '14. 示例：{"id":"trace-risk-share","numberText":"81.46%","semanticLabel":"银担分险授信额度占比","sourceType":"derived","sourceIds":["stats.riskCreditTotal","stats.grantedTotal"],"formula":"stats.riskCreditTotal / stats.grantedTotal"}',
      ].join('\n'),
    },
  ];
  const generated = await blackwhiteJson(generatedCreditReportWithTraceSchema, messages, {
    temperature: 0.2,
    timeoutMs: 180_000,
  });
  validateGeneratedTrace(generated, collectValidSourceIds(promptPayload));
  return generated;
}

export async function writeGeneratedCreditReport(payload: { rawText: string; dataTrace?: CreditTraceItem[] }) {
  const report: GeneratedCreditReportWithTrace = {
    rawText: normalizeCreditReportText(payload.rawText),
    generatedAt: new Date().toISOString(),
    dataTrace: payload.dataTrace ?? [],
  };

  await ensureDir(path.dirname(GENERATED_REPORT_CACHE));
  await fs.writeFile(GENERATED_REPORT_CACHE, JSON.stringify(report, null, 2), 'utf8');
  return report;
}

export async function getGeneratedCreditReport(): Promise<GeneratedCreditReportWithTrace | null> {
  try {
    const raw = await fs.readFile(GENERATED_REPORT_CACHE, 'utf8');
    return generatedCreditReportSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderCreditReportHtml(report: GeneratedCreditReport) {
  const parsed = parseCreditReportText(report.rawText);

  const bodyHtml = parsed.blocks
    .map((block) => {
      if (block.kind === 'section') {
        return `<p style="margin: 14px 0 10px; font-size: 16px; font-weight: 700; line-height: 2;">${escapeHtml(block.text)}</p>`;
      }

      if (block.kind === 'item') {
        return `<p style="margin: 0 0 10px; font-size: 15px; line-height: 2; text-indent: 2em;">${escapeHtml(block.text)}</p>`;
      }

      return `<p style="margin: 0 0 10px; font-size: 15px; line-height: 2; text-indent: 2em;">${escapeHtml(block.text)}</p>`;
    })
    .join('');

  return `<!DOCTYPE html>
  <html lang="zh-CN">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(parsed.title)}</title>
    </head>
    <body style="margin: 0; background: #ffffff; font-family: 'Songti SC', 'STSong', 'SimSun', serif; color: #111827; padding: 56px 72px;">
      <article style="max-width: 860px; margin: 0 auto;">
        <h1 style="margin: 0 0 28px; text-align: center; font-size: 24px; line-height: 1.8; font-weight: 700;">${escapeHtml(parsed.title)}</h1>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 2;">${escapeHtml(parsed.addressee)}</p>
        ${bodyHtml}
        ${parsed.attachmentLine ? `<p style="margin: 22px 0 40px; line-height: 2; font-size: 15px;">${escapeHtml(parsed.attachmentLine)}</p>` : ''}
        <div style="margin-top: 36px; text-align: right; line-height: 2; font-size: 15px;">
          ${parsed.signatureDepartment ? `<p style="margin: 0;">${escapeHtml(parsed.signatureDepartment)}</p>` : ''}
          ${parsed.signatureDate ? `<p style="margin: 0;">${escapeHtml(parsed.signatureDate)}</p>` : ''}
        </div>
      </article>
    </body>
  </html>`;
}
