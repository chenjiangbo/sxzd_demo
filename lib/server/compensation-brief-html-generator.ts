import ejs from 'ejs';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 准备代偿补偿简报渲染数据
 */
function prepareCompensationRenderData(mappingData: Record<string, any>): Record<string, any> {
  // 扁平化嵌套对象
  const flatData: Record<string, string> = {};
  flattenObject(mappingData, '', flatData);
  
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
        result[newKey] = String(value ?? '');
      }
    }
  }
}

/**
 * 使用 HTML + 占位符替换生成代偿补偿简报
 * @returns 渲染后的 HTML
 */
export async function generateCompensationBriefHTML(): Promise<string> {
  try {
    console.log('开始生成代偿补偿 HTML 简报...');
    
    // 1. 读取占位符映射数据(异步)
    const mappingPath = path.join(process.cwd(), 'data', 'compensation-mapping.json');
    const mappingData = JSON.parse(await fs.promises.readFile(mappingPath, 'utf-8'));
    
    // 2. 准备渲染数据(扁平化)
    const flatData: Record<string, string> = {};
    flattenObject(mappingData, '', flatData);
    
    console.log('扁平化后的key示例:', Object.keys(flatData).slice(0, 10));
    console.log('meta.year值:', flatData['meta.year']);
    
    // 3. 读取 HTML 模板(异步)
    const templatePath = path.join(process.cwd(), 'templates', 'compensation-template.html');
    let templateContent = await fs.promises.readFile(templatePath, 'utf-8');
    
    // 检查模板中实际的占位符格式
    const placeholderMatches = templateContent.match(/\{\{[^}]+\}\}/g);
    console.log('模板中的占位符示例:', placeholderMatches ? placeholderMatches.slice(0, 10) : '无');
    
    // 4. 手动替换 {{placeholder}} 占位符
    console.log('开始替换占位符, 共', Object.keys(flatData).length, '个');
    let replaceCount = 0;
    for (const [key, value] of Object.entries(flatData)) {
      const placeholder = `{{${key}}}`;
      const count = (templateContent.match(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (count > 0) {
        console.log(`替换 ${placeholder} -> ${value} (出现${count}次)`);
        // 使用全局替换,处理所有出现的占位符
        templateContent = templateContent.split(placeholder).join(value || '');
        replaceCount++;
      }
    }
    console.log('成功替换了', replaceCount, '个占位符');
    
    console.log('代偿补偿 HTML 简报生成成功!');
    
    return templateContent;
  } catch (error) {
    console.error('生成代偿补偿 HTML 简报失败:', error);
    throw new Error(`代偿补偿 HTML 简报生成失败:${error instanceof Error ? error.message : '未知错误'}`);
  }
}
