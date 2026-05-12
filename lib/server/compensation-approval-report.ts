import path from 'node:path';
import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { blackwhiteJson } from '@/lib/server/blackwhite';
import { getDemoCacheRoot } from '@/lib/server/runtime-root';
import { getCaseAnalysis } from '@/lib/server/case-analysis';
import type { CitationSource, GeneratedCompensationReport } from '@/lib/compensation-report-format';
import { getCompensationPromptConfig, type CompensationPromptConfig } from '@/lib/server/compensation-report-prompt-config';

const GENERATED_REPORT_CACHE = path.join(getDemoCacheRoot(), 'compensation-report', 'approval-report.json');
const EDITED_REPORT_CACHE = path.join(getDemoCacheRoot(), 'compensation-report', 'approval-report-edited.json');

const approvalBorrowRowSchema = z.object({
  index: z.string(),
  item: z.string(),
  content: z.string(),
});

const approvalRiskRowSchema = z.object({
  compensationDate: z.string(),
  uncompensatedPrincipal: z.string(),
  indemnityAmount: z.string(),
  ratio: z.string(),
  compensationAmount: z.string(),
});

const generatedCompensationReportSchema = z.object({
  rawText: z.string().min(1),
  generatedAt: z.string().min(1),
  sourceCatalog: z.record(
    z.string(),
    z.object({
      sourceId: z.string(),
      label: z.string(),
      fileName: z.string(),
      relativePath: z.string(),
      kind: z.enum(['xlsx', 'pdf', 'derived']),
      sheet: z.string().optional(),
      field: z.string().optional(),
      excerpt: z.string().optional(),
      formula: z.string().optional(),
    }),
  ).default({}),
  citations: z.record(z.string(), z.array(z.string())).default({}),
  structured: z.object({
    header: z.object({
      guarantorName: z.string(),
      date: z.string(),
      title: z.string(),
    }),
    sections: z.object({
      debtorProfile: z.array(z.string()),
      borrowRows: z.array(approvalBorrowRowSchema),
      counterGuarantee: z.array(z.string()),
      filingInfo: z.array(z.string()),
      compensationReason: z.array(z.string()),
      riskRows: z.array(approvalRiskRowSchema),
      riskExplanation: z.array(z.string()),
      recoveryPlan: z.array(z.string()),
      conclusion: z.array(z.string()),
    }),
  }),
});

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function renderRawText(report: GeneratedCompensationReport['structured']) {
  const lines: string[] = [];
  lines.push(report.header.title);
  lines.push(`担保机构名称：${report.header.guarantorName}    日期：${report.header.date}`);
  lines.push('');
  lines.push('一、债务人基本情况');
  lines.push(...report.sections.debtorProfile);
  lines.push('');
  lines.push('二、借款情况');
  report.sections.borrowRows.forEach((row) => {
    lines.push(`${row.index}. ${row.item}：${row.content}`);
  });
  lines.push('');
  lines.push('三、反担保措施');
  lines.push(...report.sections.counterGuarantee);
  lines.push('');
  lines.push('四、备案情况');
  lines.push(...report.sections.filingInfo);
  lines.push('');
  lines.push('五、代偿原因');
  lines.push(...report.sections.compensationReason);
  lines.push('');
  lines.push('六、分险比例与分险金额');
  report.sections.riskRows.forEach((row) => {
    lines.push(
      `${row.compensationDate} | ${row.uncompensatedPrincipal} | ${row.indemnityAmount} | ${row.ratio} | ${row.compensationAmount}`,
    );
  });
  lines.push(...report.sections.riskExplanation);
  lines.push('');
  lines.push('七、追偿方案');
  lines.push(...report.sections.recoveryPlan);
  lines.push('');
  lines.push('结论');
  lines.push(...report.sections.conclusion);
  return lines.join('\n');
}

function buildPromptPayload(analysis: Awaited<ReturnType<typeof getCaseAnalysis>>) {
  return {
    summary: analysis.summary,
    keyFacts: analysis.keyFacts,
    materials: analysis.materials.map((item) => ({
      name: item.name,
      status: item.status,
      matchedFiles: item.matchedFiles,
      aiReason: item.aiReason,
      manualAttention: item.manualAttention,
    })),
    rules: analysis.rules,
    risks: analysis.risks,
    reviewSummary: analysis.reviewSummary,
    oaFlow: analysis.oaFlow,
  };
}

function buildGenerationMessages(payload: ReturnType<typeof buildPromptPayload>, promptConfig: CompensationPromptConfig) {
  return [
    {
      role: 'system' as const,
      content: [
        '你是一名担保行业代偿补偿审批表写作助手。',
        '你的任务不是生成长篇散文，而是生成一份结构化审批表内容，用于渲染成正式审批表页面。',
        ...promptConfig.businessRequirements,
        ...promptConfig.templateConstraints,
        ...promptConfig.technicalRequirements,
      ].join('\n'),
    },
    {
      role: 'user' as const,
      content: JSON.stringify(
        {
          template_goal: '生成《宝鸡三家村餐饮管理有限公司项目再担保代偿补偿审批表》的结构化内容，页面最终会渲染成正式审批表版式。',
          output_schema: {
            header: {
              guarantorName: 'string',
              date: 'string',
              title: 'string',
            },
            sections: {
              debtorProfile: ['string'],
              borrowRows: [{ index: 'string', item: 'string', content: 'string' }],
              counterGuarantee: ['string'],
              filingInfo: ['string'],
              compensationReason: ['string'],
              riskRows: [
                {
                  compensationDate: 'string',
                  uncompensatedPrincipal: 'string',
                  indemnityAmount: 'string',
                  ratio: 'string',
                  compensationAmount: 'string',
                },
              ],
              riskExplanation: ['string'],
              recoveryPlan: ['string'],
              conclusion: ['string'],
            },
          },
          business_requirements: promptConfig.businessRequirements.map((item, index) => `${index + 1}. ${item}`),
          template_constraints: promptConfig.templateConstraints.map((item, index) => `${index + 1}. ${item}`),
          output_requirements: promptConfig.technicalRequirements.map((item, index) => `${index + 1}. ${item}`),
          reference_resources: promptConfig.resources,
          data: payload,
        },
        null,
        2,
      ),
    },
  ];
}

function normalizeBorrowItemLabel(item: string) {
  if (item.includes('债权人')) return 'bank';
  if (item.includes('主债权金额')) return 'amount';
  if (item.includes('借款合同')) return 'contractNo';
  if (item.includes('保证合同')) return 'guaranteeNo';
  if (item.includes('委保合同') || item.includes('委托保证合同')) return 'entrustNo';
  if (item.includes('主债权起始日期')) return 'debtStartDate';
  if (item.includes('主债权到期日期')) return 'debtMaturityDate';
  return null;
}

function formatChineseDate(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!match) return null;
  return `${match[1]}年${Number(match[2])}月${Number(match[3])}日`;
}

function addSourceIfMatched(sourceIds: string[], text: string, sourceId: string, values: Array<string | null | undefined>) {
  if (values.some((value) => value && text.includes(value))) {
    sourceIds.push(sourceId);
  }
}

function buildReportCitations(analysis: Awaited<ReturnType<typeof getCaseAnalysis>>, report: GeneratedCompensationReport) {
  const sourceCatalog: Record<string, CitationSource> = {};
  const citations: Record<string, string[]> = {};

  for (const sources of Object.values(analysis.factSources)) {
    for (const source of sources) {
      sourceCatalog[source.sourceId] = {
        sourceId: source.sourceId,
        label: source.label,
        fileName: source.fileName,
        relativePath: source.relativePath,
        kind: source.kind,
        sheet: source.sheet,
        field: source.field,
        excerpt: source.excerpt,
        formula: source.formula,
      };
    }
  }

  citations['header.guarantorName'] = ['guarantor'];
  citations['header.date'] = ['reportDate'];

  report.structured.sections.borrowRows.forEach((row, index) => {
    const sourceId = normalizeBorrowItemLabel(row.item);
    if (sourceId) {
      citations[`sections.borrowRows.${index}.content`] = [sourceId];
    }
  });

  report.structured.sections.riskRows.forEach((_, index) => {
    citations[`sections.riskRows.${index}.compensationDate`] = ['compensationDate'];
    citations[`sections.riskRows.${index}.uncompensatedPrincipal`] = ['uncompensatedPrincipal'];
    citations[`sections.riskRows.${index}.indemnityAmount`] = ['indemnityAmount'];
    citations[`sections.riskRows.${index}.ratio`] = ['reGuaranteeRatio'];
    citations[`sections.riskRows.${index}.compensationAmount`] = ['compensationAmount'];
  });

  report.structured.sections.debtorProfile.forEach((text, index) => {
    const sourceIds: string[] = [];
    addSourceIfMatched(sourceIds, text, 'company', [analysis.summary.company]);
    addSourceIfMatched(sourceIds, text, 'unifiedCode', [analysis.keyFacts.unifiedCode]);
    addSourceIfMatched(sourceIds, text, 'bank', [analysis.summary.bank]);
    addSourceIfMatched(sourceIds, text, 'amount', [analysis.summary.amount, analysis.summary.amount.replace(/\s+/g, '')]);
    addSourceIfMatched(sourceIds, text, 'guarantor', [analysis.summary.guarantor]);
    addSourceIfMatched(sourceIds, text, 'debtStartDate', [analysis.keyFacts.debtStartDate, formatChineseDate(analysis.keyFacts.debtStartDate)]);
    if (sourceIds.length > 0) {
      citations[`sections.debtorProfile.${index}`] = Array.from(new Set(sourceIds));
    }
  });

  report.structured.sections.filingInfo.forEach((text, index) => {
    const sourceIds = [];
    if (text.includes(analysis.keyFacts.businessNo)) sourceIds.push('businessNo');
    if (analysis.keyFacts.initialBusinessNo && text.includes(analysis.keyFacts.initialBusinessNo)) sourceIds.push('initialBusinessNo');
    if (text.includes(analysis.keyFacts.contractNo)) sourceIds.push('contractNo');
    if (analysis.keyFacts.initialContractNo && text.includes(analysis.keyFacts.initialContractNo)) sourceIds.push('initialContractNo');
    if (sourceIds.length > 0) {
      citations[`sections.filingInfo.${index}`] = Array.from(new Set(sourceIds));
    }
  });

  report.structured.sections.conclusion.forEach((text, index) => {
    const sourceIds = [];
    if (text.includes(analysis.keyFacts.compensationAmount)) sourceIds.push('compensationAmount');
    if (text.includes(analysis.keyFacts.uncompensatedPrincipal)) sourceIds.push('uncompensatedPrincipal');
    if (text.includes(analysis.keyFacts.reGuaranteeRatio)) sourceIds.push('reGuaranteeRatio');
    if (sourceIds.length > 0) {
      citations[`sections.conclusion.${index}`] = Array.from(new Set(sourceIds));
    }
  });

  return {
    sourceCatalog,
    citations,
  };
}

async function enrichReportWithCitations(report: GeneratedCompensationReport) {
  const analysis = await getCaseAnalysis('baoji-sanjiacun');
  const citationBundle = buildReportCitations(analysis, report);
  return {
    ...report,
    sourceCatalog: {
      ...report.sourceCatalog,
      ...citationBundle.sourceCatalog,
    },
    citations: {
      ...report.citations,
      ...citationBundle.citations,
    },
  };
}

export async function generateCompensationApprovalReport(force = false) {
  if (!force) {
    const cached = await getGeneratedCompensationReport();
    if (cached) return { report: cached, cached: true };
  }

  const analysis = await getCaseAnalysis('baoji-sanjiacun');
  const payload = buildPromptPayload(analysis);
  const promptConfig = await getCompensationPromptConfig();

  const structured = await blackwhiteJson(
    generatedCompensationReportSchema.shape.structured,
    buildGenerationMessages(payload, promptConfig),
    { temperature: 0.15 },
  );

  const report: GeneratedCompensationReport = {
    rawText: renderRawText(structured),
    generatedAt: new Date().toISOString(),
    sourceCatalog: {},
    citations: {},
    structured,
  };
  const citationBundle = buildReportCitations(analysis, report);
  report.sourceCatalog = citationBundle.sourceCatalog;
  report.citations = citationBundle.citations;

  await ensureDir(path.dirname(GENERATED_REPORT_CACHE));
  await fs.writeFile(GENERATED_REPORT_CACHE, JSON.stringify(report, null, 2), 'utf8');
  await fs.rm(EDITED_REPORT_CACHE, { force: true });
  return { report, cached: false };
}

export async function getGeneratedCompensationReport() {
  try {
    const raw = await fs.readFile(GENERATED_REPORT_CACHE, 'utf8');
    const parsed = generatedCompensationReportSchema.parse(JSON.parse(raw));
    const enriched = await enrichReportWithCitations(parsed);
    if (
      Object.keys(parsed.sourceCatalog).length !== Object.keys(enriched.sourceCatalog).length ||
      Object.keys(parsed.citations).length !== Object.keys(enriched.citations).length
    ) {
      await fs.writeFile(GENERATED_REPORT_CACHE, JSON.stringify(enriched, null, 2), 'utf8');
    }
    return enriched;
  } catch {
    return null;
  }
}

export async function getEditedCompensationReport() {
  try {
    const raw = await fs.readFile(EDITED_REPORT_CACHE, 'utf8');
    const parsed = generatedCompensationReportSchema.parse(JSON.parse(raw));
    const enriched = await enrichReportWithCitations(parsed);
    if (
      Object.keys(parsed.sourceCatalog).length !== Object.keys(enriched.sourceCatalog).length ||
      Object.keys(parsed.citations).length !== Object.keys(enriched.citations).length
    ) {
      await fs.writeFile(EDITED_REPORT_CACHE, JSON.stringify(enriched, null, 2), 'utf8');
    }
    return enriched;
  } catch {
    return null;
  }
}

export async function getEffectiveCompensationReport() {
  const edited = await getEditedCompensationReport();
  if (edited) return edited;
  return getGeneratedCompensationReport();
}

export async function saveEditedCompensationReport(report: GeneratedCompensationReport) {
  const normalized = generatedCompensationReportSchema.parse({
    ...report,
    rawText: renderRawText(report.structured),
    generatedAt: report.generatedAt || new Date().toISOString(),
  });
  await ensureDir(path.dirname(EDITED_REPORT_CACHE));
  await fs.writeFile(EDITED_REPORT_CACHE, JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
}
