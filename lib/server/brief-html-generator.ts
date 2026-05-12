import ejs from 'ejs';
import fs from 'node:fs';
import path from 'node:path';

type CitationSource = {
  label: string;
  fileName: string;
  field: string;
  method: string;
};

const BRIEF_SOURCE_LABEL = '担保业务统计表';
const BRIEF_TABLE_CAPTIONS = [
  '合作担保机构全口径新增担保业务规模统计表',
  '担保机构再担保业务统计表',
  '合作银行业务统计表',
  '再担保业务综合融资成本统计表',
  '银行参与分险再担保业务统计表',
  '合作银行分险业务统计表',
  '地市银行参与分险业务规模统计表',
  '国担基金"总对总"批量担保业务统计表',
  '地方版"总对总"批量担保业务统计表',
  '合作银行"总对总"批量担保业务统计表',
  '创业担保贷款再担保业务统计表',
  '"科技创新专项担保计划"业务统计表',
];

const briefCitationCss = `
        .brief-citation {
            position: relative;
            display: inline;
            color: #002b5b;
            text-decoration-line: underline;
            text-decoration-style: dotted;
            text-decoration-color: rgba(0, 43, 91, 0.45);
            text-underline-offset: 3px;
            cursor: help;
        }

        .brief-citation-popover {
            display: none;
            pointer-events: none;
            position: absolute;
            left: 50%;
            bottom: 100%;
            z-index: 100;
            width: 360px;
            transform: translateX(-50%);
            margin-bottom: 8px;
            padding: 12px 14px;
            border: 1px solid rgba(0, 43, 91, 0.14);
            border-radius: 14px;
            background: #fffaf0;
            color: #334155;
            box-shadow: 0 16px 40px rgba(11, 28, 48, 0.18);
            font-size: 12px;
            line-height: 1.7;
            text-align: left;
            text-indent: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-weight: 400;
            white-space: normal;
        }

        .brief-citation:hover .brief-citation-popover,
        .brief-citation:focus .brief-citation-popover {
            display: block;
        }

        .brief-citation-popover::after {
            content: "";
            position: absolute;
            left: 50%;
            top: 100%;
            width: 12px;
            height: 12px;
            transform: translate(-50%, -50%) rotate(45deg);
            background: #fffaf0;
            border-right: 1px solid rgba(0, 43, 91, 0.14);
            border-bottom: 1px solid rgba(0, 43, 91, 0.14);
        }

        .brief-citation-title {
            display: inline-block;
            margin-bottom: 6px;
            padding: 2px 10px;
            border-radius: 999px;
            background: rgba(0, 43, 91, 0.1);
            color: #002b5b;
            font-size: 11px;
            font-weight: 800;
        }

        .brief-citation-line {
            display: block;
            margin-top: 3px;
        }

        .brief-citation-box {
            display: block;
            margin-top: 6px;
            padding: 6px 8px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.72);
        }
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createCitationMarkup(value: string, source: CitationSource): string {
  return `
<span class="brief-citation" tabindex="0" data-brief-citation="source">
    ${escapeHtml(value)}
    <span class="brief-citation-popover" data-brief-citation-popover="true">
        <span class="brief-citation-title">数据来源</span>
        <span class="brief-citation-box"><strong>来源文件：</strong>${escapeHtml(source.fileName)}</span>
    </span>
</span>`.trim();
}

function injectCitationStyles(html: string): string {
  if (html.includes('.brief-citation-popover')) return html;
  return html.replace('</style>', `${briefCitationCss}\n    </style>`);
}

/**
 * 将 CSV 表格数据转换为 HTML 表格
 */
function createHTMLTable(headers: string[], rows: string[][], tableName: string): string {
  const headerRow = `<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
  const dataRows = rows
    .map((row, rowIndex) => {
      // 跳过空行或只有合计的行
      if (row.every(cell => !cell.trim() || cell.includes('合计'))) {
        return null;
      }
      return `<tr>${row.map((cell, cellIndex) => {
        const align = cellIndex === 0 ? 'left' : 'right';
        const header = headers[cellIndex] || `第${cellIndex + 1}列`;
        const value = createCitationMarkup(cell, {
          label: `${tableName} / ${header}`,
          fileName: BRIEF_SOURCE_LABEL,
          field: `${tableName} / 第${rowIndex + 1}行 / ${header}`,
          method: '读取 CSV 表格对应单元格',
        });
        return `<td style="text-align: ${align}">${value}</td>`;
      }).join('')}</tr>`;
    })
    .filter(row => row !== null)
    .join('');
  
  return `<table>
<thead>${headerRow}</thead>
<tbody>${dataRows}</tbody>
</table>`;
}

/**
 * 分割 CSV 为多个表格
 */
function splitCSVToTables(csvContent: string): Array<{ headers: string[]; rows: string[][] }> {
  const sections = csvContent.split(/\n\s*\n/).filter(section => section.trim().length > 0);
  const tables: Array<{ headers: string[]; rows: string[][] }> = [];
  
  for (const section of sections) {
    const lines = section.split('\n').filter(line => line.trim());
    if (lines.length < 1) continue;
    
    // 解析表头（移除 BOM）
    const headers = lines[0].replace(/^\ufeff/, '').split(',').map(h => h.trim());
    
    // 检查是否有第二行表头（说明行）
    let dataStartIndex = 1;
    if (lines.length > 1 && lines[1] && !lines[1].match(/^\d/) && lines[1].includes(',')) {
      dataStartIndex = 2;
    }
    
    // 解析数据行
    const rows: string[][] = [];
    for (let i = dataStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cells = line.split(',').map(cell => cell.trim());
      rows.push(cells);
    }
    
    if (headers.length > 0) {
      tables.push({ headers, rows });
    }
  }
  
  return tables;
}

/**
 * 获取简报表格数据（用于前端展示）
 */
export function getBriefTableData() {
  try {
    const csvPath = path.join(process.cwd(), 'data', 'GuaranteeBusinessBriefTableData.csv');
    console.log('读取 CSV 文件:', csvPath);
    
    if (!fs.existsSync(csvPath)) {
      console.error('CSV 文件不存在:', csvPath);
      return [];
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    console.log('CSV 文件读取成功，长度:', csvContent.length);
    
    const tables = splitCSVToTables(csvContent);
    console.log('CSV 解析完成，共', tables.length, '个表格');

    return tables.map((table, index) => ({
      name: BRIEF_TABLE_CAPTIONS[index] || `表${index + 1}`,
      caption: `表${index + 1}：${BRIEF_TABLE_CAPTIONS[index] || ''}`,
      headers: table.headers || [],
      rows: table.rows || [],
    }));
  } catch (error) {
    console.error('获取简报表格数据失败:', error);
    return [];
  }
}

/**
 * 准备渲染数据
 */
function prepareRenderData(mappingData: Record<string, any>, csvPath: string): Record<string, any> {
  // 扁平化嵌套对象
  const flatData: Record<string, string> = {};
  flattenObject(mappingData, '', flatData);
  
  // 读取 CSV 并生成 HTML 表格（同步）
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const tables = splitCSVToTables(csvContent);
  
  console.log(`CSV 解析完成，共 ${tables.length} 个表格`);
  
  // 按照模板需要的名字映射表格
  const tableNames = [
    'inst_table',           // 表一：合作担保机构全口径新增担保业务规模统计表
    're_guarantee_table',   // 表二：担保机构再担保业务统计表
    'bank_table',           // 表三：合作银行业务统计表
    'cost_table',           // 表四：再担保业务综合融资成本统计表
    'risk_sharing_table',   // 表五：银行参与分险再担保业务统计表
    'bank_risk_table',      // 表六：合作银行分险业务统计表
    'region_risk_table',    // 表七：地市银行参与分险业务规模统计表
    'national_zdz_table',   // 表八：国担基金"总对总"批量担保业务统计表
    'local_zdz_table',      // 表九：地方版"总对总"批量担保业务统计表
    'bank_zdz_table',       // 表十：合作银行"总对总"批量担保业务统计表
    'chuangye_table',       // 表十一：创业担保贷款再担保业务统计表
    'tech_guarantee_table'  // 表十二："科技创新专项担保计划"业务统计表
  ];
  
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const tableName = tableNames[i] || `table_${i + 1}`;
    const tableCaption = BRIEF_TABLE_CAPTIONS[i] || tableName;
    flatData[tableName] = createHTMLTable(table.headers, table.rows, `表${i + 1}：${tableCaption}`);
    console.log(`${tableName}: ${table.headers.length} 列，${table.rows.length} 行`);
  }
  
  // 添加报告标题和日期
  flatData['report_title'] = '业务一部担保业务简报';
  flatData['report_period'] = '2026 年上半年';
  flatData['report_date'] = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  flatData['remark'] = '数据来源于业务系统，统计截止日期为报告期末最后一个工作日。';
  
  return flatData;
}

function buildCitationMarker(key: string) {
  return `__BRIEF_CITATION__${key}__`;
}

function buildCitationRenderData(flatData: Record<string, string>) {
  const renderData: Record<string, string> = {};
  const markerMap = new Map<string, string>();

  for (const [key, value] of Object.entries(flatData)) {
    if (key.endsWith('_table')) {
      renderData[key] = value;
      continue;
    }

    if (key === 'report_title') {
      renderData[key] = value;
      continue;
    }

    const marker = buildCitationMarker(key);
    renderData[key] = marker;
    markerMap.set(marker, createCitationMarkup(value, {
      label: key,
      fileName: BRIEF_SOURCE_LABEL,
      field: key.replaceAll('_', '.'),
      method: '读取简报映射数据对应字段',
    }));
  }

  return { renderData, markerMap };
}

function applyCitationMarkers(html: string, markerMap: Map<string, string>) {
  let result = html;
  for (const [marker, markup] of markerMap.entries()) {
    result = result.split(marker).join(markup);
  }
  return result;
}

function flattenObject(obj: Record<string, any>, prefix: string, result: Record<string, string>): void {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}_${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattenObject(value, newKey, result);
      } else {
        result[newKey] = value ?? '';
      }
    }
  }
}

/**
 * 使用 HTML + EJS 模板生成简报
 * @param periodText - 期间文本（如：2026 年上半年）
 * @returns 渲染后的 HTML
 */
export async function generateBriefHTML(periodText: string): Promise<string> {
  try {
    console.log('开始生成 HTML 简报...');
    
    // 1. 读取占位符映射数据（异步）
    const mappingPath = path.join(process.cwd(), 'data', 'placeholder-mapping.json');
    const mappingData = JSON.parse(await fs.promises.readFile(mappingPath, 'utf-8'));
    
    // 2. 读取 CSV 数据路径
    const csvPath = path.join(process.cwd(), 'data', 'GuaranteeBusinessBriefTableData.csv');
    
    // 3. 准备渲染数据
    const renderData = prepareRenderData(mappingData, csvPath);
    renderData['periodText'] = periodText;
    
    // 4. 读取 HTML 模板（异步）
    const templatePath = path.join(process.cwd(), 'templates', 'brief-template.html');
    const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
    
    // 5. 使用 EJS 渲染
    const { renderData: citationRenderData, markerMap } = buildCitationRenderData(renderData);
    const html = ejs.render(templateContent, citationRenderData);
    const htmlWithCitations = injectCitationStyles(applyCitationMarkers(html, markerMap));
    
    console.log('HTML 简报生成成功！');
    
    return htmlWithCitations;
  } catch (error) {
    console.error('生成 HTML 简报失败:', error);
    throw new Error(`HTML 简报生成失败：${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 将 HTML 转换为 PDF（需要额外安装 puppeteer）
 * 这是一个示例函数，如需使用请安装：npm install puppeteer
 */
export async function convertHTMLToPDF(html: string, outputPath: string): Promise<void> {
  try {
    // 注意：此函数需要安装 puppeteer 才能运行
    // npm install puppeteer
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '3.7cm',
        bottom: '3.5cm',
        left: '2.8cm',
        right: '2.6cm'
      }
    });
    await browser.close();
  } catch (error) {
    console.error('转换 PDF 失败:', error);
    throw new Error('PDF 转换失败，请确保已安装 puppeteer: npm install puppeteer');
  }
}
