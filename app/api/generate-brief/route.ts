import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { generateBriefDocument } from '@/lib/server/brief-generator';

// 从 JSON 文件读取占位符映射数据
async function loadPlaceholderMapping() {
  const mappingPath = path.join(process.cwd(), 'data', 'placeholder-mapping.json');
  const content = await fs.readFile(mappingPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * 准备填充数据
 * 直接使用 JSON 中的数据结构，docxtemplater 支持嵌套对象访问
 */
function prepareDataForTemplate(mappingData: Record<string, any>): Record<string, any> {
  console.log('准备的数据结构:', JSON.stringify(mappingData, null, 2));
  
  // 直接返回原始数据结构即可
  // docxtemplater 可以自动处理 {{meta.issue_number}} 这样的嵌套访问
  return mappingData;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { period, periodText, year } = body;

    console.log('生成简报:', { period, periodText, year });

    // 1. 读取占位符映射数据
    const mappingData = await loadPlaceholderMapping();
    
    // 2. 准备填充数据（直接使用 JSON 结构）
    const templateData = prepareDataForTemplate(mappingData);
    
    // 3. 找到 Word 模板文件路径
    const templatePath = path.join(process.cwd(), 'data', 'GuaranteeBusinessTemplate.docx');
    
    // 4. 使用 docxtemplater 填充模板生成 Word 文档
    const docBuffer = await generateBriefDocument(templatePath, templateData);

    // 4. 返回生成的文档
    const filename = `担保业务简报-${periodText || '最新'}.docx`;
    return new NextResponse(docBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename).replace(/'/g, '%27')}"`,
      },
    });
  } catch (error) {
    console.error('生成简报失败:', error);
    return NextResponse.json(
      { error: '生成简报失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
