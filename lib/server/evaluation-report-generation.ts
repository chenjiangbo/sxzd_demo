import path from 'node:path';
import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { blackwhiteJson } from '@/lib/server/blackwhite';
import { getDemoCacheRoot } from '@/lib/server/runtime-root';
import type { EvaluationReportDocument, EvaluationInstitutionSnapshot, EvaluationReportNarrative } from '@/lib/server/evaluation-report-html';
import { getEvaluationPromptConfig } from '@/lib/server/evaluation-report-prompt-config';

const EVALUATION_REPORT_GENERATION_VERSION = '2026-04-02-evaluation-report-template-v2';

const evaluationNarrativeSchema = z.object({
  businessAnalysisParagraphs: z.array(z.string().min(1)).min(1).max(4),
  annualTargetLead: z.string().min(1),
  annualTargetAnalysisParagraphs: z.array(z.string().min(1)).min(1).max(3),
  creditUsageParagraphs: z.array(z.string().min(1)).min(1).max(4),
  conclusionParagraphs: z.array(z.string().min(1)).min(1).max(2),
});

function getCachePath(institutionId: string) {
  return path.join(getDemoCacheRoot(), 'evaluation-report', 'generated', `${institutionId}-${EVALUATION_REPORT_GENERATION_VERSION}.json`);
}

export async function hasGeneratedEvaluationReport(institutionId: string) {
  try {
    await fs.access(getCachePath(institutionId));
    return true;
  } catch {
    return false;
  }
}

async function ensureParent(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function buildPrompt(institution: EvaluationInstitutionSnapshot, promptConfig: Awaited<ReturnType<typeof getEvaluationPromptConfig>>) {
  const resourceLines = promptConfig.resources.map((item, index) => {
    const pathLine = item.path ? `；路径：${item.path}` : '';
    return `${index + 1}. ${item.title}（类型：${item.kind}；用途：${item.purpose}${pathLine}）`;
  });

  return [
    '你是政府性融资担保机构年度评价报告撰写专家。',
    '任务：根据给定机构指标，为“陕西省政府性融资担保机构综合评价报告”生成结构化正文内容。',
    `今天是：${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    '业务要求：',
    ...promptConfig.businessRequirements.map((item, index) => `${index + 1}. ${item}`),
    '',
    '格式要求：',
    ...promptConfig.templateConstraints.map((item, index) => `${index + 1}. ${item}`),
    '',
    '参考模板与资料：',
    ...resourceLines,
    '',
    '输入机构数据：',
    `机构名称：${institution.name}`,
    `机构简称：${institution.shortName}`,
    `区域层级：${institution.regionLevel}`,
    `综合评价：${institution.overallStatus}`,
    `新增担保业务规模：目标 ${institution.targetScale.toFixed(2)} 亿元，实际 ${institution.actualScale.toFixed(2)} 亿元，完成率 ${(institution.scaleCompletionRate * 100).toFixed(2)}%`,
    `小微三农融资担保业务占比：目标 ${(institution.targetCustomerRatio * 100).toFixed(2)}%，实际 ${(institution.actualCustomerRatio * 100).toFixed(2)}%，完成率 ${(institution.customerRatioCompletionRate * 100).toFixed(2)}%`,
    `再担保规模：目标 ${institution.targetReGuarantee.toFixed(2)} 亿元，实际 ${institution.actualReGuarantee.toFixed(2)} 亿元，完成率 ${(institution.reGuaranteeCompletionRate * 100).toFixed(2)}%`,
    `分险业务占比：目标 ${(institution.targetRiskShare * 100).toFixed(2)}%，实际 ${(institution.actualRiskShare * 100).toFixed(2)}%，完成率 ${(institution.riskShareCompletionRate * 100).toFixed(2)}%`,
    `担保放大倍数：目标 ${institution.targetLeverage.toFixed(2)} 倍，实际 ${institution.actualLeverage.toFixed(2)} 倍，完成率 ${(institution.leverageCompletionRate * 100).toFixed(2)}%`,
    `合作业务代偿率：目标不超过 ${(institution.targetCompensationRate * 100).toFixed(2)}%，实际 ${(institution.actualCompensationRate * 100).toFixed(2)}%，状态 ${institution.compensationRateStatus}`,
    `代偿补偿返还率：目标 ${(institution.targetRecoveryRate * 100).toFixed(2)}%，实际 ${(institution.actualRecoveryRate * 100).toFixed(2)}%，完成率 ${(institution.recoveryRateCompletionRate * 100).toFixed(2)}%`,
    '',
    '输出 JSON 结构：',
    JSON.stringify({
      businessAnalysisParagraphs: ['段落 1', '段落 2'],
      annualTargetLead: '一句导语',
      annualTargetAnalysisParagraphs: ['段落 1'],
      creditUsageParagraphs: ['段落 1'],
      conclusionParagraphs: ['段落 1'],
    }),
  ].join('\n');
}

function buildDocument(institution: EvaluationInstitutionSnapshot, narrative: EvaluationReportNarrative): EvaluationReportDocument {
  return {
    institution,
    generatedAt: new Date().toISOString(),
    investigator: '（待填写）',
    interviewee: '（待填写）',
    surveyDate: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月${new Date().getDate()}日`,
    narrative,
  };
}

export async function generateEvaluationReportDocument(institution: EvaluationInstitutionSnapshot, force = false) {
  const cachePath = getCachePath(institution.id);

  if (!force) {
    try {
      const cached = await fs.readFile(cachePath, 'utf8');
      console.log(`[评价报告] 命中缓存: ${institution.shortName}`);
      return JSON.parse(cached) as EvaluationReportDocument;
    } catch {
      // no cache
    }
  }

  console.log(`[评价报告] 开始生成: ${institution.shortName}`);
  const promptConfig = await getEvaluationPromptConfig();
  const promptContent = buildPrompt(institution, promptConfig);
  console.log(`[评价报告] Prompt长度: ${promptContent.length} 字符`);
  
  try {
    const narrative = await blackwhiteJson(
      evaluationNarrativeSchema,
      [
        {
          role: 'system',
          content: [
            '你是政府性融资担保机构年度评价报告撰写专家。',
            '回答必须严格基于提供数据，不得虚构缺失事实。',
            ...promptConfig.technicalRequirements.map((item, index) => `技术要求 ${index + 1}：${item}`),
          ].join('\n'),
        },
        {
          role: 'user',
          content: promptContent,
        },
      ],
      {
        temperature: 0.2,
        timeoutMs: 300_000, // 增加到5分钟
      },
    );

    const document = buildDocument(institution, narrative);
    await ensureParent(cachePath);
    await fs.writeFile(cachePath, JSON.stringify(document, null, 2), 'utf8');
    console.log(`[评价报告] 生成成功: ${institution.shortName}`);
    return document;
  } catch (error) {
    console.error(`[评价报告] 生成失败: ${institution.shortName}`, error);
    throw error;
  }
}
