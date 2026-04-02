/**
 * 评价报告 HTML 渲染工具
 * 将大模型生成的纯文本报告渲染为标准 A4 HTML 文档
 */

export type EvaluationReport = {
  rawText: string;
  generatedAt: string;
  institutionId: string;
  institutionName: string;
};

/**
 * HTML 转义
 */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * 解析报告文本结构
 */
export function parseEvaluationReportText(text: string): {
  title: string;
  institutionInfo: string;
  sections: Array<{ heading: string; content: string }>;
  conclusion: string;
} {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  // 提取标题
  const titleMatch = text.match(/陕西省政府性融资担保机构综合评价报告/);
  const title = titleMatch ? '陕西省政府性融资担保机构综合评价报告' : '评价报告';
  
  // 提取机构信息
  const institutionInfoMatch = text.match(/机构名称：[^\n]+/);
  const institutionInfo = institutionInfoMatch ? institutionInfoMatch[0] : '';
  
  // 提取各个章节
  const sections: Array<{ heading: string; content: string }> = [];
  const sectionPattern = /([一二三四五六七八九十]+)[、.]([\s\S]*?)(?=[一二三四五六七八九十]+[、.]|$)/g;
  
  let match;
  while ((match = sectionPattern.exec(text)) !== null) {
    sections.push({
      heading: match[1] + '、' + match[2].split('\n')[0],
      content: match[2].trim(),
    });
  }
  
  // 提取结论
  const conclusionMatch = text.match(/四、结论\s*([\s\S]*)/);
  const conclusion = conclusionMatch ? conclusionMatch[1].trim() : '';
  
  return {
    title,
    institutionInfo,
    sections,
    conclusion,
  };
}

/**
 * 渲染评价报告 HTML（标准 A4 格式）
 */
export function renderEvaluationReportHtml(report: EvaluationReport): string {
  const parsed = parseEvaluationReportText(report.rawText);
  
  // 生成表格 HTML（如果有的话）
  const tableHtml = report.rawText.includes('单位：亿元、倍、%') 
    ? generatePolicyTableHtml(report.rawText)
    : '';
  
  const businessTableHtml = report.rawText.includes('业务分类\t业务规模\t占比')
    ? generateBusinessTableHtml(report.rawText)
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(parsed.title)}</title>
  <style>
    @page {
      size: A4;
      margin: 3.7cm 2.6cm 3.5cm 2.8cm;
    }
    
    body {
      margin: 0;
      background: #ffffff;
      font-family: 'Songti SC', 'STSong', 'SimSun', serif;
      color: #111827;
      padding: 56px 72px;
      max-width: 595pt;
      margin: 0 auto;
    }
    
    h1 {
      margin: 0 0 28px;
      text-align: center;
      font-size: 22px;
      line-height: 1.8;
      font-weight: 700;
    }
    
    .institution-info {
      margin: 0 0 16px;
      font-size: 15px;
      line-height: 2;
    }
    
    h2 {
      margin: 24px 0 12px;
      font-size: 16px;
      font-weight: 700;
      line-height: 2;
    }
    
    p {
      margin: 0 0 10px;
      font-size: 15px;
      line-height: 2;
      text-indent: 2em;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12px;
    }
    
    th, td {
      border: 1px solid #000;
      padding: 8px 6px;
      text-align: center;
    }
    
    th {
      background-color: #f0f0f0;
      font-weight: 700;
    }
    
    .signature {
      margin-top: 36px;
      text-align: right;
      line-height: 2;
      font-size: 15px;
    }
    
    .date {
      margin-top: 22px;
      text-align: right;
      font-size: 15px;
    }
  </style>
</head>
<body>
  <article>
    <h1>${escapeHtml(parsed.title)}</h1>
    
    ${parsed.institutionInfo ? `<div class="institution-info">${escapeHtml(parsed.institutionInfo)}</div>` : ''}
    
    ${parsed.sections.map((section, index) => `
      <h2>${escapeHtml(section.heading)}</h2>
      ${index === 1 && tableHtml ? tableHtml : ''}
      ${index === 2 && businessTableHtml ? businessTableHtml : ''}
      <div>${formatSectionContent(section.content)}</div>
    `).join('')}
    
    ${parsed.conclusion ? `
      <h2>四、结论</h2>
      <div>${formatSectionContent(parsed.conclusion)}</div>
    ` : ''}
    
    <div class="signature">
      <p>业务一部</p>
    </div>
    
    <div class="date">
      <p>${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </article>
</body>
</html>`;
}

/**
 * 格式化章节内容（处理段落和缩进）
 */
function formatSectionContent(content: string): string {
  return content
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p style="text-indent: 2em;">${escapeHtml(line.trim())}</p>`)
    .join('');
}

/**
 * 生成政策指标表格 HTML
 */
function generatePolicyTableHtml(text: string): string {
  // 尝试从文本中提取表格数据
  const tableMatch = text.match(/指标名称[\s\S]*?完成进度[^\n]*/);
  if (!tableMatch) return '';
  
  return `
    <table>
      <thead>
        <tr>
          <th>指标名称</th>
          <th>新增担保业务规模</th>
          <th>小微三农融资担保业务占比</th>
          <th>单户 500 万以下融资担保业务占比</th>
          <th>再担保规模</th>
          <th>分险业务占比</th>
          <th>担保放大倍数</th>
          <th>合作业务代偿率</th>
          <th>代偿补偿返还率</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>目标值</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>不超过 2%</td>
          <td>10.00%</td>
        </tr>
        <tr>
          <td>实际值</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
        </tr>
        <tr>
          <td>完成进度</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
        </tr>
      </tbody>
    </table>
  `;
}

/**
 * 生成业务分类表格 HTML
 */
function generateBusinessTableHtml(text: string): string {
  return `
    <table>
      <thead>
        <tr>
          <th>业务分类</th>
          <th>业务规模（万元）</th>
          <th>占比</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>总对总批量担保业务（国担版和地方版）</td>
          <td>-</td>
          <td>-</td>
        </tr>
        <tr>
          <td>其中：国担版银担总对总业务</td>
          <td>-</td>
          <td>-</td>
        </tr>
        <tr>
          <td>地方版银担总对总业务</td>
          <td>-</td>
          <td>-</td>
        </tr>
        <tr>
          <td>传统直保业务</td>
          <td>-</td>
          <td>-</td>
        </tr>
        <tr>
          <td>合计</td>
          <td>-</td>
          <td>100.00%</td>
        </tr>
      </tbody>
    </table>
  `;
}
