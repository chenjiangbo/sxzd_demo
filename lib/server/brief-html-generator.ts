import ejs from 'ejs';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 将 CSV 表格数据转换为 HTML 表格
 */
function createHTMLTable(headers: string[], rows: string[][]): string {
  const headerRow = `<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
  const dataRows = rows
    .map((row, rowIndex) => {
      // 跳过空行或只有合计的行
      if (row.every(cell => !cell.trim() || cell.includes('合计'))) {
        return null;
      }
      return `<tr>${row.map((cell, cellIndex) => {
        const align = cellIndex === 0 ? 'left' : 'right';
        return `<td style="text-align: ${align}">${escapeHtml(cell)}</td>`;
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
 * HTML 转义
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
  
  // 将表格添加到上下文中
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    flatData[`table_${i + 1}`] = createHTMLTable(table.headers, table.rows);
    console.log(`表格 ${i + 1}: ${table.headers.length} 列，${table.rows.length} 行`);
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

function flattenObject(obj: Record<string, any>, prefix: string, result: Record<string, string>): void {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
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
    const html = ejs.render(templateContent, renderData);
    
    console.log('HTML 简报生成成功！');
    
    return html;
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
