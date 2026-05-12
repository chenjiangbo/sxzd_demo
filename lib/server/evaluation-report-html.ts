export type EvaluationInstitutionSnapshot = {
  id: string;
  name: string;
  shortName: string;
  regionLevel: '省级' | '市级' | '县区';
  overallStatus: '优秀' | '良好' | '达标' | '待改进';
  targetScale: number;
  actualScale: number;
  scaleCompletionRate: number;
  targetCustomerRatio: number;
  actualCustomerRatio: number;
  customerRatioCompletionRate: number;
  targetReGuarantee: number;
  actualReGuarantee: number;
  reGuaranteeCompletionRate: number;
  targetRiskShare: number;
  actualRiskShare: number;
  riskShareCompletionRate: number;
  targetLeverage: number;
  actualLeverage: number;
  leverageCompletionRate: number;
  targetCompensationRate: number;
  actualCompensationRate: number;
  compensationRateStatus: string;
  targetRecoveryRate: number;
  actualRecoveryRate: number;
  recoveryRateCompletionRate: number;
};

export type EvaluationReportNarrative = {
  businessAnalysisParagraphs: string[];
  annualTargetLead: string;
  annualTargetAnalysisParagraphs: string[];
  creditUsageParagraphs: string[];
  conclusionParagraphs: string[];
};

export type EvaluationReportDocument = {
  institution: EvaluationInstitutionSnapshot;
  generatedAt: string;
  investigator: string;
  interviewee: string;
  surveyDate: string;
  narrative: EvaluationReportNarrative;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatNumber(value: number, digits = 2) {
  return value.toFixed(digits);
}

function formatPercent(value: number, digits = 2) {
  return `${(value * 100).toFixed(digits)}%`;
}

type EvaluationCitationSource = {
  label: string;
  fileName: string;
  field: string;
  method: string;
};

type EvaluationCitationTarget = {
  value: string;
  source: EvaluationCitationSource;
};

type EvaluationPolicyCell = string | {
  value: string;
  source: EvaluationCitationSource;
};

const EVALUATION_SOURCE_FILE = 'evaluation-report-2026-04-01.xls';

const citationCss = `
  <style>
    .eval-citation {
      position: relative;
      display: inline;
      color: #002b5b;
      text-decoration-line: underline;
      text-decoration-style: dotted;
      text-decoration-color: rgba(0, 43, 91, 0.5);
      text-underline-offset: 4px;
      cursor: pointer;
    }
    .eval-citation-popover {
      display: none;
      pointer-events: none;
      position: absolute;
      left: 50%;
      bottom: 100%;
      z-index: 50;
      width: 380px;
      transform: translateX(-50%);
      margin-bottom: 8px;
      padding: 14px;
      border: 1px solid rgba(0, 43, 91, 0.15);
      border-radius: 16px;
      background: #fffaf0;
      color: #334155;
      box-shadow: 0 18px 45px rgba(11, 28, 48, 0.18);
      font-size: 12px;
      line-height: 1.7;
      text-align: left;
      text-indent: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-weight: 400;
    }
    .eval-citation:hover .eval-citation-popover,
    .eval-citation:focus .eval-citation-popover {
      display: block;
    }
    .eval-citation-popover::after {
      content: "";
      position: absolute;
      left: 50%;
      top: 100%;
      width: 12px;
      height: 12px;
      transform: translate(-50%, -50%) rotate(45deg);
      background: #fffaf0;
      border-right: 1px solid rgba(0, 43, 91, 0.15);
      border-bottom: 1px solid rgba(0, 43, 91, 0.15);
    }
    .eval-citation-title {
      display: inline-block;
      margin-bottom: 6px;
      padding: 2px 10px;
      border-radius: 999px;
      background: rgba(0, 43, 91, 0.1);
      color: #002b5b;
      font-size: 11px;
      font-weight: 800;
    }
    .eval-citation-line {
      display: block;
      margin-top: 3px;
    }
    .eval-citation-box {
      display: block;
      margin-top: 6px;
      padding: 6px 8px;
      border-radius: 8px;
      background: rgba(255,255,255,0.72);
    }
  </style>
`;

function renderCitation(value: string, source: EvaluationCitationSource) {
  return `
    <span class="eval-citation" tabindex="0" data-eval-citation="source">
      ${escapeHtml(value)}
      <span class="eval-citation-popover" data-eval-citation-popover="true">
        <span class="eval-citation-title">${escapeHtml(source.label)}</span>
        <span class="eval-citation-line"><strong>来源文件：</strong>${escapeHtml(source.fileName)}</span>
        <span class="eval-citation-line"><strong>字段/口径：</strong>${escapeHtml(source.field)}</span>
        <span class="eval-citation-box"><strong>取数方式：</strong>${escapeHtml(source.method)}</span>
      </span>
    </span>
  `;
}

function createSource(label: string, field: string, method = '读取评价统计表对应机构明细行'): EvaluationCitationSource {
  return {
    label,
    fileName: EVALUATION_SOURCE_FILE,
    field,
    method,
  };
}

function addTarget(targets: EvaluationCitationTarget[], value: string, source: EvaluationCitationSource) {
  const normalized = value.trim();
  if (!normalized || normalized === '0.00' || normalized === '0.00%') return;
  targets.push({ value: normalized, source });
}

function buildCitationTargets(institution: EvaluationInstitutionSnapshot): EvaluationCitationTarget[] {
  const targets: EvaluationCitationTarget[] = [];

  addTarget(targets, institution.name, createSource('机构名称', '机构名称'));
  addTarget(targets, institution.shortName, createSource('机构简称', '机构简称'));
  addTarget(targets, institution.overallStatus, createSource('综合评价结果', '根据 8 项指标达标情况计算'));

  addTarget(targets, formatNumber(institution.targetScale), createSource('新增担保业务规模目标值', '新增担保业务规模 / 目标值'));
  addTarget(targets, formatNumber(institution.actualScale), createSource('新增担保业务规模实际值', '新增担保业务规模 / 实际值'));
  addTarget(targets, formatPercent(institution.scaleCompletionRate), createSource('新增担保业务规模完成率', '新增担保业务规模 / 完成进度', '实际值 ÷ 目标值'));

  addTarget(targets, formatPercent(institution.targetCustomerRatio), createSource('小微三农占比目标值', '小微三农融资担保业务占比 / 目标值'));
  addTarget(targets, formatPercent(institution.actualCustomerRatio), createSource('小微三农占比实际值', '小微三农融资担保业务占比 / 实际值'));
  addTarget(targets, formatPercent(institution.customerRatioCompletionRate), createSource('小微三农占比完成率', '小微三农融资担保业务占比 / 完成进度', '实际值 ÷ 目标值'));

  addTarget(targets, formatNumber(institution.targetReGuarantee), createSource('再担保规模目标值', '再担保规模 / 目标值'));
  addTarget(targets, formatNumber(institution.actualReGuarantee), createSource('再担保规模实际值', '再担保规模 / 实际值'));
  addTarget(targets, formatPercent(institution.reGuaranteeCompletionRate), createSource('再担保规模完成率', '再担保规模 / 完成进度', '实际值 ÷ 目标值'));

  addTarget(targets, formatPercent(institution.targetRiskShare), createSource('分险业务占比目标值', '分险业务占比 / 目标值'));
  addTarget(targets, formatPercent(institution.actualRiskShare), createSource('分险业务占比实际值', '分险业务占比 / 实际值'));
  addTarget(targets, formatPercent(institution.riskShareCompletionRate), createSource('分险业务占比完成率', '分险业务占比 / 完成进度', '实际值 ÷ 目标值'));

  addTarget(targets, formatNumber(institution.targetLeverage), createSource('担保放大倍数目标值', '担保放大倍数 / 目标值'));
  addTarget(targets, formatNumber(institution.actualLeverage), createSource('担保放大倍数实际值', '担保放大倍数 / 实际值'));
  addTarget(targets, formatPercent(institution.leverageCompletionRate), createSource('担保放大倍数完成率', '担保放大倍数 / 完成进度', '实际值 ÷ 目标值'));

  addTarget(targets, `不超过${formatPercent(institution.targetCompensationRate, 0)}`, createSource('合作业务代偿率目标值', '合作业务代偿率 / 目标值'));
  addTarget(targets, formatPercent(institution.actualCompensationRate), createSource('合作业务代偿率实际值', '合作业务代偿率 / 实际值'));
  addTarget(targets, institution.compensationRateStatus, createSource('合作业务代偿率状态', '合作业务代偿率 / 完成进度'));

  addTarget(targets, formatPercent(institution.targetRecoveryRate), createSource('代偿补偿返还率目标值', '代偿补偿返还率 / 目标值'));
  addTarget(targets, formatPercent(institution.actualRecoveryRate), createSource('代偿补偿返还率实际值', '代偿补偿返还率 / 实际值'));
  addTarget(targets, formatPercent(institution.recoveryRateCompletionRate), createSource('代偿补偿返还率完成率', '代偿补偿返还率 / 完成进度', '实际值 ÷ 目标值'));

  return targets.sort((a, b) => b.value.length - a.value.length);
}

function renderTextWithCitations(text: string, targets: EvaluationCitationTarget[]) {
  const matches = targets
    .map((target) => ({
      ...target,
      index: text.indexOf(target.value),
    }))
    .filter((match) => match.index >= 0)
    .sort((a, b) => a.index - b.index || b.value.length - a.value.length);

  const selected: Array<EvaluationCitationTarget & { start: number; end: number }> = [];
  for (const match of matches) {
    const start = match.index;
    const end = start + match.value.length;
    if (selected.some((item) => start < item.end && end > item.start)) continue;
    selected.push({ value: match.value, source: match.source, start, end });
  }

  if (selected.length === 0) return escapeHtml(text);

  const parts: string[] = [];
  let cursor = 0;
  for (const match of selected.sort((a, b) => a.start - b.start)) {
    if (match.start > cursor) {
      parts.push(escapeHtml(text.slice(cursor, match.start)));
    }
    parts.push(renderCitation(match.value, match.source));
    cursor = match.end;
  }
  if (cursor < text.length) {
    parts.push(escapeHtml(text.slice(cursor)));
  }

  return parts.join('');
}

function renderParagraph(paragraph: string, targets: EvaluationCitationTarget[]) {
  return `<p style="margin: 0 0 18px; text-indent: 2em; font-size: 20px; line-height: 2.1; color: #111827;">${renderTextWithCitations(paragraph, targets)}</p>`;
}

function renderSection(title: string, bodyHtml: string) {
  return `
    <section style="margin-top: 40px;">
      <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 700; line-height: 1.5; color: #000000; font-family: 'SimSun', 'Songti SC', serif;">${escapeHtml(title)}</h2>
      <div>
        ${bodyHtml}
      </div>
    </section>
  `;
}

function policyCell(value: string, source: EvaluationCitationSource): EvaluationPolicyCell {
  return { value, source };
}

function buildPolicyRows(institution: EvaluationInstitutionSnapshot): EvaluationPolicyCell[][] {
  return [
    [
      '目标值',
      policyCell(formatNumber(institution.targetScale), createSource('新增担保业务规模目标值', '新增担保业务规模 / 目标值')),
      policyCell(formatPercent(institution.targetCustomerRatio), createSource('小微三农占比目标值', '小微三农融资担保业务占比 / 目标值')),
      '50.00%',
      policyCell(formatNumber(institution.targetReGuarantee), createSource('再担保规模目标值', '再担保规模 / 目标值')),
      policyCell(formatPercent(institution.targetRiskShare), createSource('分险业务占比目标值', '分险业务占比 / 目标值')),
      policyCell(formatNumber(institution.targetLeverage), createSource('担保放大倍数目标值', '担保放大倍数 / 目标值')),
      policyCell(`不超过${formatPercent(institution.targetCompensationRate, 0)}`, createSource('合作业务代偿率目标值', '合作业务代偿率 / 目标值')),
      policyCell(formatPercent(institution.targetRecoveryRate), createSource('代偿补偿返还率目标值', '代偿补偿返还率 / 目标值')),
    ],
    [
      '实际值',
      policyCell(formatNumber(institution.actualScale), createSource('新增担保业务规模实际值', '新增担保业务规模 / 实际值')),
      policyCell(formatPercent(institution.actualCustomerRatio), createSource('小微三农占比实际值', '小微三农融资担保业务占比 / 实际值')),
      '（待补充）',
      policyCell(formatNumber(institution.actualReGuarantee), createSource('再担保规模实际值', '再担保规模 / 实际值')),
      policyCell(formatPercent(institution.actualRiskShare), createSource('分险业务占比实际值', '分险业务占比 / 实际值')),
      policyCell(formatNumber(institution.actualLeverage), createSource('担保放大倍数实际值', '担保放大倍数 / 实际值')),
      policyCell(formatPercent(institution.actualCompensationRate), createSource('合作业务代偿率实际值', '合作业务代偿率 / 实际值')),
      policyCell(formatPercent(institution.actualRecoveryRate), createSource('代偿补偿返还率实际值', '代偿补偿返还率 / 实际值')),
    ],
    [
      '完成进度',
      policyCell(formatPercent(institution.scaleCompletionRate), createSource('新增担保业务规模完成率', '新增担保业务规模 / 完成进度', '实际值 ÷ 目标值')),
      policyCell(formatPercent(institution.customerRatioCompletionRate), createSource('小微三农占比完成率', '小微三农融资担保业务占比 / 完成进度', '实际值 ÷ 目标值')),
      '（待补充）',
      policyCell(formatPercent(institution.reGuaranteeCompletionRate), createSource('再担保规模完成率', '再担保规模 / 完成进度', '实际值 ÷ 目标值')),
      policyCell(formatPercent(institution.riskShareCompletionRate), createSource('分险业务占比完成率', '分险业务占比 / 完成进度', '实际值 ÷ 目标值')),
      policyCell(formatPercent(institution.leverageCompletionRate), createSource('担保放大倍数完成率', '担保放大倍数 / 完成进度', '实际值 ÷ 目标值')),
      policyCell(institution.compensationRateStatus, createSource('合作业务代偿率状态', '合作业务代偿率 / 完成进度')),
      policyCell(formatPercent(institution.recoveryRateCompletionRate), createSource('代偿补偿返还率完成率', '代偿补偿返还率 / 完成进度', '实际值 ÷ 目标值')),
    ],
  ];
}

function renderPolicyCell(cell: EvaluationPolicyCell, isRowHeader: boolean, targets: EvaluationCitationTarget[]) {
  if (typeof cell === 'string') {
    return isRowHeader ? escapeHtml(cell) : renderTextWithCitations(cell, targets);
  }

  return renderCitation(cell.value, cell.source);
}

function renderPolicyTable(institution: EvaluationInstitutionSnapshot, targets: EvaluationCitationTarget[]) {
  const headers = [
    '指标名称',
    '新增担保业务规模',
    '小微三农融资担保业务占比',
    '单户500万以下融资担保业务占比',
    '再担保规模',
    '分险业务占比',
    '担保放大倍数',
    '合作业务代偿率',
    '代偿补偿返还率',
  ];

  const rows = buildPolicyRows(institution)
    .map(
      (row) => `
        <tr>
          ${row
            .map(
              (cell, index) => `
                <td style="border: 1.6px solid #1f2937; padding: 16px 10px; text-align: center; vertical-align: middle; font-size: 17px; line-height: 1.7; ${
                  index === 0 ? 'font-weight: 700; width: 120px;' : ''
                }">
                  ${renderPolicyCell(cell, index === 0, targets)}
                </td>`,
            )
            .join('')}
        </tr>`,
    )
    .join('');

  return `
    <div style="display: flex; justify-content: flex-end; margin-bottom: 8px; font-size: 17px; color: #111827;">单位：亿元、倍、%</div>
    <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 18px;">
      <thead>
        <tr>
          ${headers
            .map(
              (header, index) => `
                <th style="border: 1.8px solid #1f2937; padding: 18px 10px; background: #ffffff; text-align: center; vertical-align: middle; font-size: 17px; line-height: 1.65; font-weight: 700; ${
                  index === 0 ? 'width: 120px;' : ''
                }">
                  ${escapeHtml(header)}
                </th>`,
            )
            .join('')}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderBusinessStructureTable() {
  const rows = [
    ['1', '业务构成明细', '（待补充）', '（待补充）'],
    ['2', '业务构成明细', '（待补充）', '（待补充）'],
    ['合计', '合计', '（待补充）', '100.00%'],
  ];

  return `
    <div style="display: flex; justify-content: flex-end; margin-bottom: 8px; font-size: 17px; color: #111827;">单位：万元</div>
    <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 18px;">
      <thead>
        <tr>
          <th style="border: 1.8px solid #1f2937; padding: 14px 10px; width: 90px; text-align: center; font-size: 17px; font-weight: 700;">序号</th>
          <th style="border: 1.8px solid #1f2937; padding: 14px 10px; text-align: center; font-size: 17px; font-weight: 700;">业务分类</th>
          <th style="border: 1.8px solid #1f2937; padding: 14px 10px; width: 180px; text-align: center; font-size: 17px; font-weight: 700;">业务规模</th>
          <th style="border: 1.8px solid #1f2937; padding: 14px 10px; width: 180px; text-align: center; font-size: 17px; font-weight: 700;">占比</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                ${row
                  .map(
                    (cell) => `
                      <td style="border: 1.6px solid #1f2937; padding: 16px 10px; text-align: center; vertical-align: middle; font-size: 17px; line-height: 1.7;">
                        ${escapeHtml(cell)}
                      </td>`,
                  )
                  .join('')}
              </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  `;
}

function renderCover(document: EvaluationReportDocument, targets: EvaluationCitationTarget[]) {
  return `
    <section style="padding: 80px 0 60px;">
      <h1 style="margin: 0 0 40px; text-align: center; font-size: 28px; line-height: 1.6; font-weight: 700; color: #000000;">陕西省政府性融资担保机构综合评价报告</h1>
      <div style="max-width: 760px; margin: 0 auto; font-size: 19px; line-height: 2.2; color: #111827;">
        <p style="margin: 0 0 10px;"><strong>机构名称：</strong>${renderTextWithCitations(document.institution.name, targets)}</p>
        <p style="margin: 0 0 10px;"><strong>调查部门：</strong>业务一部</p>
        <p style="margin: 0 0 10px;"><strong>调查人员：</strong>${escapeHtml(document.investigator)}</p>
        <p style="margin: 0 0 10px;"><strong>约谈对象：</strong>${escapeHtml(document.interviewee)}</p>
        <p style="margin: 0;"><strong>调查时间：</strong>${escapeHtml(document.surveyDate)}</p>
      </div>
    </section>
  `;
}

export function renderEvaluationReportBodyHtml(document: EvaluationReportDocument) {
  const { institution, narrative } = document;
  const citationTargets = buildCitationTargets(institution);

  const section1 = renderSection(
    '一、经营情况变化及分析',
    narrative.businessAnalysisParagraphs.map((paragraph) => renderParagraph(paragraph, citationTargets)).join(''),
  );

  const section2 = renderSection(
    '二、年度政策目标完成情况',
    `
      ${renderParagraph(narrative.annualTargetLead, citationTargets)}
      ${renderPolicyTable(institution, citationTargets)}
      ${narrative.annualTargetAnalysisParagraphs.map((paragraph) => renderParagraph(paragraph, citationTargets)).join('')}
    `,
  );

  const section3 = renderSection(
    '三、授信使用及业务开展',
    `
      ${narrative.creditUsageParagraphs.map((paragraph) => renderParagraph(paragraph, citationTargets)).join('')}
      ${renderBusinessStructureTable()}
      <p style="margin: 0 0 18px; text-indent: 2em; font-size: 18px; line-height: 2; color: #6b7280;">当前数据集中未提供该机构业务分类明细，表格保留模板结构，具体数据待补充。</p>
    `,
  );

  const section4 = renderSection(
    '四、结论',
    narrative.conclusionParagraphs.map((paragraph) => renderParagraph(paragraph, citationTargets)).join(''),
  );

  return `
    <div style="max-width: 800px; margin: 0 auto; background: #ffffff; padding: 54px 48px 70px; font-family: 'SimSun', 'Songti SC', serif;">
      ${citationCss}
      ${renderCover(document, citationTargets)}
      ${section1}
      ${section2}
      ${section3}
      ${section4}
    </div>
  `;
}

export function renderEvaluationReportHtml(document: EvaluationReportDocument) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(document.institution.name)}评价报告</title>
</head>
<body style="margin: 0; background: #ffffff;">
${renderEvaluationReportBodyHtml(document)}
</body>
</html>`;
}
