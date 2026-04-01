import path from 'node:path';
import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { blackwhiteJson } from '@/lib/server/blackwhite';
import { getDemoCacheRoot } from '@/lib/server/runtime-root';
import { getCaseAnalysis } from '@/lib/server/case-analysis';
import type { GeneratedCompensationReport } from '@/lib/compensation-report-format';

const GENERATED_REPORT_CACHE = path.join(getDemoCacheRoot(), 'compensation-report', 'approval-report.json');

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

export async function generateCompensationApprovalReport(force = false) {
  if (!force) {
    const cached = await getGeneratedCompensationReport();
    if (cached) return { report: cached, cached: true };
  }

  const analysis = await getCaseAnalysis('baoji-sanjiacun');
  const payload = buildPromptPayload(analysis);

  const structured = await blackwhiteJson(
    generatedCompensationReportSchema.shape.structured,
    [
      {
        role: 'system',
        content: [
          '你是一名担保行业代偿补偿审批表写作助手。',
          '你的任务不是生成长篇散文，而是生成一份结构化审批表内容，用于渲染成正式审批表页面。',
          '必须严格基于输入数据，不得编造事实、金额、合同号、业务编号和结论。',
          '对于需要人工确认的内容，必须在具体文本里写出【人工复核】。',
          '只返回 JSON，不要输出 markdown，不要输出解释。',
        ].join('\n'),
      },
      {
        role: 'user',
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
            requirements: [
              '标题固定为“宝鸡三家村餐饮管理有限公司项目再担保代偿补偿审批表”。',
              'header.guarantorName 必须写担保机构名称，header.date 必须写审批表日期。',
              'debtProfile、counterGuarantee、filingInfo、compensationReason、riskExplanation、recoveryPlan、conclusion 都写成适合审批表直接展示的完整句子数组。',
              'borrowRows 必须严格按“序号 / 项目 / 内容”结构输出，不要合并成段落。',
              'borrowRows 的项目字段优先对齐审批表常见行：债权人、主债权金额、担保费率、借款合同号、保证合同号、委保合同号、主债权起始日期、主债权到期日期。',
              'riskRows 必须严格输出表格行，不要合并成段落；列含义固定为：代偿时间、债务人未清偿本金、原担保机构代偿金额、省级再担责任比例、省级再担代偿补偿金额。',
              '三、反担保措施 需要写成完整说明，不要只写一个比例。',
              '四、备案情况 需要同时体现首次备案、展期续备案以及当前备案确认情况，不要只写日期。',
              '五、代偿原因 需要写成审批表式说明，不要写成聊天总结。',
              '七、追偿方案 需要写明确的追偿方式和计划，不要只写“建议进入OA流程”。',
              '结论 只写审批结论，不要重复整页所有风险点。',
              '整体版式请尽量贴近正式审批表，而不是普通报告：正文应以短段落和表格行为主，不要输出散文化长篇论述。',
              '一、债务人基本情况 优先写成 1 段主体画像说明，必要时补 1 段经营情况说明。',
              '四、备案情况 需要明确“首次备案”“展期续备案”“当前备案确认”的时间与关系。',
              '五、代偿原因 需要说明企业经营情况导致代偿，以及代偿证明/付款凭证对应的代偿金额。',
              '六、分险比例与分险金额 在表格之后补 1 段责任比例和补偿金额计算说明。',
              '结论请尽量贴近正式审批口径，例如“经审查，该项目符合我司代偿补偿条件，建议对该项目进行代偿补偿，我司需补偿XXX元。”',
              '金额、比例、合同号、业务编号必须与输入数据一致。',
              '结论必须与当前规则结果一致。',
              '不要输出 markdown 符号，不要输出 **、#、-、```。',
            ],
            data: payload,
          },
          null,
          2,
        ),
      },
    ],
    { temperature: 0.15 },
  );

  const report: GeneratedCompensationReport = {
    rawText: renderRawText(structured),
    generatedAt: new Date().toISOString(),
    structured,
  };

  await ensureDir(path.dirname(GENERATED_REPORT_CACHE));
  await fs.writeFile(GENERATED_REPORT_CACHE, JSON.stringify(report, null, 2), 'utf8');
  return { report, cached: false };
}

export async function getGeneratedCompensationReport() {
  try {
    const raw = await fs.readFile(GENERATED_REPORT_CACHE, 'utf8');
    return generatedCompensationReportSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}
