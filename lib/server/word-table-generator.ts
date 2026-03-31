import PizZip from 'pizzip';
import { promises as fs } from 'node:fs';

/**
 * 解析 CSV 数据为结构化数组
 * @param csvContent - CSV 文件内容
 * @returns 解析后的表格数据
 */
export function parseCSV(csvContent: string): { headers: string[]; rows: string[][] } {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  
  // 解析表头（处理合并单元格的情况）
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.replace(/^\ufeff/, '').trim());
  
  // 检查是否有第二行表头（合并单元格说明）
  let dataStartIndex = 1;
  if (lines.length > 1 && !lines[1].match(/^\d/)) {
    // 第二行不是数据，跳过
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
  
  return { headers, rows };
}

/**
 * 将 XML 特殊字符转义
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 创建 Word 表格的 XML
 * @param headers - 表头数组
 * @param rows - 数据行数组
 * @param tableWidth - 表格宽度（twips 单位，默认 9000 约等于页面宽度的 100%）
 * @returns Word 表格 XML 字符串
 */
export function createWordTableXML(
  headers: string[],
  rows: string[][],
  tableWidth: number = 9000
): string {
  const columnCount = headers.length;
  const columnWidth = Math.floor(tableWidth / columnCount);
  
  // 构建表头
  const headerCells = headers
    .map(header => `
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="${columnWidth}" w:type="dxa"/>
          <w:shd w:val="clear" w:color="auto" w:fill="E7E6E6"/>
          <w:tcBorders>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
          </w:tcBorders>
          <w:vAlign w:val="center"/>
        </w:tcPr>
        <w:p>
          <w:pPr>
            <w:jc w:val="center"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:b/>
              <w:sz w:val="21"/>
              <w:szCs w:val="21"/>
            </w:rPr>
            <w:t>${escapeXml(header)}</w:t>
          </w:r>
        </w:p>
      </w:tc>`).join('');
  
  // 构建数据行
  const dataRows = rows
    .map(row => {
      const cells = row
        .map((cell, index) => `
          <w:tc>
            <w:tcPr>
              <w:tcW w:w="${columnWidth}" w:type="dxa"/>
              <w:tcBorders>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
              </w:tcBorders>
              <w:vAlign w:val="center"/>
            </w:tcPr>
            <w:p>
              <w:pPr>
                <w:jc w:val="${index === 0 ? 'left' : 'right'}"/>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:sz w:val="21"/>
                  <w:szCs w:val="21"/>
                </w:rPr>
                <w:t>${escapeXml(cell)}</w:t>
              </w:r>
            </w:p>
          </w:tc>`).join('');
      
      return `<w:tr>${cells}</w:tr>`;
    })
    .join('');
  
  // 完整表格 XML
  return `
    <w:tbl>
      <w:tblPr>
        <w:tblStyle w:val="TableGrid"/>
        <w:tblW w:w="${tableWidth}" w:type="dxa"/>
        <w:tblInd w:w="0" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/>
          <w:left w:val="single" w:sz="8" w:space="0" w:color="000000"/>
          <w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>
          <w:right w:val="single" w:sz="8" w:space="0" w:color="000000"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tblGrid>
        ${Array(columnCount).fill(`<w:gridCol w:w="${columnWidth}"/>`).join('')}
      </w:tblGrid>
      <w:tr>
        ${headerCells}
      </w:tr>
      ${dataRows}
    </w:tbl>
  `;
}

/**
 * 从 CSV 文件读取并转换为 Word 表格 XML
 * @param csvPath - CSV 文件路径
 * @param tableWidth - 表格宽度
 * @returns Word 表格 XML
 */
export async function loadCSVAndCreateTableXML(
  csvPath: string,
  tableWidth: number = 9000
): Promise<string> {
  const csvContent = await fs.readFile(csvPath, 'utf-8');
  const { headers, rows } = parseCSV(csvContent);
  return createWordTableXML(headers, rows, tableWidth);
}

/**
 * 在 Word 文档 XML 中替换表格占位符
 * @param xmlContent - Word 文档 XML 内容
 * @param placeholder - 占位符（如 {{table_1}}）
 * @param tableXML - Word 表格 XML
 * @returns 替换后的 XML
 */
export function replaceTablePlaceholder(
  xmlContent: string,
  placeholder: string,
  tableXML: string
): string {
  // 移除占位符周围的段落标签
  const paragraphRegex = new RegExp(
    `<w:p[^>]*>.*?<w:t[^>]*>\\{\\{${placeholder}\\}\\}</w:t>.*?</w:p>`,
    'gs'
  );
  
  return xmlContent.replace(paragraphRegex, tableXML);
}
