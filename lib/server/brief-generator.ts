import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from 'docx';
import PizZip from 'pizzip';
import { promises as fs } from 'node:fs';

/**
 * 生成担保业务简报 Word 文档
 * @param templatePath - Word 模板文件路径
 * @param data - 要填充的数据
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
    
    // 4. 扁平化数据，将嵌套对象转换为 key-value 对
    const flatData: Record<string, string> = {};
    flattenObject(data, '', flatData);
    
    // 5. 替换所有占位符 {{key}} -> value
    let replacedXml = documentXml;
    Object.entries(flatData).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      replacedXml = replacedXml.replace(placeholder, String(value ?? ''));
    });
    
    // 6. 更新 xml 文件
    zip.file('word/document.xml', replacedXml);
    
    // 7. 生成 buffer
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
