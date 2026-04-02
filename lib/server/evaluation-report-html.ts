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

function renderParagraph(paragraph: string) {
  return `<p style="margin: 0 0 18px; text-indent: 2em; font-size: 20px; line-height: 2.1; color: #111827;">${escapeHtml(paragraph)}</p>`;
}

function renderSection(title: string, bodyHtml: string) {
  return `
    <section style="margin-top: 0; border: 2px solid #1f2937; border-top: 0;">
      <div style="border-top: 2px solid #1f2937; border-bottom: 2px solid #1f2937; background: #d9d9d9; padding: 18px 24px;">
        <div style="font-size: 22px; font-weight: 700; line-height: 1.5; color: #000000; font-family: 'SimSun', 'Songti SC', serif;">${escapeHtml(title)}</div>
      </div>
      <div style="padding: 26px 28px 18px;">
        ${bodyHtml}
      </div>
    </section>
  `;
}

function buildPolicyRows(institution: EvaluationInstitutionSnapshot) {
  return [
    ['目标值', formatNumber(institution.targetScale), formatPercent(institution.targetCustomerRatio), '50.00%', formatNumber(institution.targetReGuarantee), formatPercent(institution.targetRiskShare), formatNumber(institution.targetLeverage), `不超过${formatPercent(institution.targetCompensationRate, 0)}`, formatPercent(institution.targetRecoveryRate)],
    ['实际值', formatNumber(institution.actualScale), formatPercent(institution.actualCustomerRatio), '（待补充）', formatNumber(institution.actualReGuarantee), formatPercent(institution.actualRiskShare), formatNumber(institution.actualLeverage), formatPercent(institution.actualCompensationRate), formatPercent(institution.actualRecoveryRate)],
    ['完成进度', formatPercent(institution.scaleCompletionRate), formatPercent(institution.customerRatioCompletionRate), '（待补充）', formatPercent(institution.reGuaranteeCompletionRate), formatPercent(institution.riskShareCompletionRate), formatPercent(institution.leverageCompletionRate), institution.compensationRateStatus, formatPercent(institution.recoveryRateCompletionRate)],
  ];
}

function renderPolicyTable(institution: EvaluationInstitutionSnapshot) {
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
                  ${escapeHtml(cell)}
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

function renderCover(document: EvaluationReportDocument) {
  return `
    <section style="min-height: 820px; display: flex; flex-direction: column; justify-content: center; padding: 60px 0 80px;">
      <h1 style="margin: 0 0 54px; text-align: center; font-size: 30px; line-height: 1.6; font-weight: 700; color: #000000;">陕西省政府性融资担保机构综合评价报告</h1>
      <div style="max-width: 760px; margin: 0 auto; font-size: 20px; line-height: 2.25; color: #111827;">
        <p style="margin: 0 0 12px;"><strong>机构名称：</strong>${escapeHtml(document.institution.name)}</p>
        <p style="margin: 0 0 12px;"><strong>调查部门：</strong>业务一部</p>
        <p style="margin: 0 0 12px;"><strong>调查人员：</strong>${escapeHtml(document.investigator)}</p>
        <p style="margin: 0 0 12px;"><strong>约谈对象：</strong>${escapeHtml(document.interviewee)}</p>
        <p style="margin: 0;"><strong>调查时间：</strong>${escapeHtml(document.surveyDate)}</p>
      </div>
    </section>
  `;
}

export function renderEvaluationReportBodyHtml(document: EvaluationReportDocument) {
  const { institution, narrative } = document;

  const section1 = renderSection(
    '一、经营情况变化及分析',
    narrative.businessAnalysisParagraphs.map(renderParagraph).join(''),
  );

  const section2 = renderSection(
    '二、年度政策目标完成情况',
    `
      <p style="margin: 0 0 18px; text-indent: 2em; font-size: 20px; line-height: 2.1; color: #111827;">${escapeHtml(narrative.annualTargetLead)}</p>
      ${renderPolicyTable(institution)}
      ${narrative.annualTargetAnalysisParagraphs.map(renderParagraph).join('')}
    `,
  );

  const section3 = renderSection(
    '三、授信使用及业务开展',
    `
      ${narrative.creditUsageParagraphs.map(renderParagraph).join('')}
      ${renderBusinessStructureTable()}
      <p style="margin: 0 0 18px; text-indent: 2em; font-size: 18px; line-height: 2; color: #6b7280;">当前数据集中未提供该机构业务分类明细，表格保留模板结构，具体数据待补充。</p>
    `,
  );

  const section4 = renderSection(
    '四、结论',
    narrative.conclusionParagraphs.map(renderParagraph).join(''),
  );

  return `
    <div style="background: #f6f8fb; padding: 32px 0;">
      <div style="width: 1120px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.10); padding: 54px 48px 70px; font-family: 'SimSun', 'Songti SC', serif;">
        ${renderCover(document)}
        ${section1}
        ${section2}
        ${section3}
        ${section4}
      </div>
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
<body style="margin: 0; background: #f6f8fb;">
${renderEvaluationReportBodyHtml(document)}
</body>
</html>`;
}
