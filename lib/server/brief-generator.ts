import PizZip from 'pizzip';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseCSV, createWordTableXML, replaceTablePlaceholder } from './word-table-generator';

/**
 * 生成担保业务简报 Word 文档
 * @param templatePath - Word 模板文件路径
 * @param data - 要填充的数据（包含 placeholder-mapping.json 的数据）
 * @returns 生成的 Word 文档 Buffer
 */
export async function generateBriefDocument(
  templatePath: string,
  data: Record<string, any>
): Promise<Buffer> {
  try {
    // 1. 读取模板文件
    const templateContent = await fs.readFile(templatePath);
    
    // 2. 创建 zip 实例
    const zip = new PizZip(templateContent);
    
    // 3. 读取 word/document.xml 文件
    const documentXml = zip.file('word/document.xml')?.asText();
    if (!documentXml) {
      throw new Error('无法读取 Word 文档内容');
    }
    
    let replacedXml = documentXml;
    
    // 4. 扁平化数据，将嵌套对象转换为 key-value 对
    const flatData: Record<string, string> = {};
    flattenObject(data, '', flatData);
    
    // 5. 替换所有文本占位符 {{key}} -> value
    Object.entries(flatData).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      replacedXml = replacedXml.replace(placeholder, String(value ?? ''));
    });
    
    // 6. 处理表格占位符 - 从 CSV 读取数据并生成 Word 表格
    const csvPath = path.join(process.cwd(), 'data', 'GuaranteeBusinessBriefTableData.csv');
    try {
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      const { headers, rows } = parseCSV(csvContent);
      
      // 按顺序分割表格数据（根据空行分割）
      const tables = splitCSVToTables(csvContent);
      
      // 替换表格占位符（table_1, table_2, ...）
      for (let i = 0; i < tables.length; i++) {
        const placeholder = `table_${i + 1}`;
        const tableXML = createWordTableXML(tables[i].headers, tables[i].rows, 9000);
        replacedXml = replaceTablePlaceholder(replacedXml, placeholder, tableXML);
      }
    } catch (error) {
      console.warn('CSV 表格数据加载失败，将跳过表格生成:', error instanceof Error ? error.message : error);
    }
    
    // 7. 更新 xml 文件
    zip.file('word/document.xml', replacedXml);
    
    // 8. 生成 buffer
    const buf = zip.generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    }) as Buffer;
    
    return buf;
  } catch (error) {
    console.error('生成 Word 文档失败:', error);
    throw new Error(`Word 文档生成失败：${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 扁平化嵌套对象
 * 例如：{ meta: { issue_number: '15' } } -> { 'meta.issue_number': '15' }
 */
function flattenObject(
  obj: Record<string, any>,
  prefix: string,
  result: Record<string, string>
): void {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // 递归处理嵌套对象
        flattenObject(value, newKey, result);
      } else {
        // 基本类型值
        result[newKey] = value ?? '';
      }
    }
  }
}

/**
 * 将 CSV 内容按空行分割成多个表格
 */
interface TableData {
  headers: string[];
  rows: string[][];
}

function splitCSVToTables(csvContent: string): TableData[] {
  const sections = csvContent.split(/\n\s*\n/).filter(section => section.trim().length > 0);
  const tables: TableData[] = [];
  
  for (const section of sections) {
    const { headers, rows } = parseCSV(section);
    if (headers.length > 0 && rows.length > 0) {
      tables.push({ headers, rows });
    }
  }
  
  return tables;
}
