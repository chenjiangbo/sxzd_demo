import { generateBriefDocument } from './lib/server/brief-generator';
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function testGenerate() {
  try {
    console.log('开始测试 Word 文档生成...');
    
    // 1. 读取占位符映射数据
    const mappingPath = path.join(__dirname, 'data', 'placeholder-mapping.json');
    const content = await fs.readFile(mappingPath, 'utf-8');
    const mappingData = JSON.parse(content);
    
    console.log('已加载占位符数据');
    
    // 2. 准备测试数据
    const testData: Record<string, any> = {};
    
    // 添加所有指标数据
    Object.entries(mappingData).forEach(([section, data]) => {
      if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        Object.entries(data).forEach(([key, value]) => {
          testData[key] = value;
        });
      }
    });
    
    console.log('测试数据准备完成');
    console.log('数据 keys:', Object.keys(testData).slice(0, 20));
    
    // 4. 找到模板文件
    const templatePath = path.join(__dirname, 'data', 'GuaranteeBusinessTemplate.docx');
    console.log('模板路径:', templatePath);
    
    // 5. 生成文档
    console.log('正在生成 Word 文档...');
    const buffer = await generateBriefDocument(templatePath, testData);
    
    // 6. 保存生成的文件
    const outputPath = path.join(__dirname, 'output-test.docx');
    await fs.writeFile(outputPath, buffer);
    
    console.log('✅ 生成成功！');
    console.log('输出文件:', outputPath);
    console.log('文件大小:', buffer.length, 'bytes');
    
  } catch (error) {
    console.error('❌ 生成失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('堆栈:', error.stack);
    }
  }
}

testGenerate();
