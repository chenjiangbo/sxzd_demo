import { parseCSV, createWordTableXML, splitCSVToTables } from './lib/server/word-table-generator';
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function testTableGeneration() {
  try {
    console.log('=== 开始测试表格生成 ===\n');
    
    // 1. 读取 CSV 文件
    const csvPath = path.join(__dirname, 'data', 'GuaranteeBusinessBriefTableData.csv');
    console.log('📄 读取 CSV 文件:', csvPath);
    
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    console.log('✅ CSV 文件大小:', csvContent.length, '字节\n');
    
    // 2. 分割成多个表格
    console.log('📊 分割表格数据...');
    const tables = splitCSVToTables(csvContent);
    console.log('✅ 共解析出', tables.length, '个表格\n');
    
    // 3. 打印每个表格的摘要
    tables.forEach((table, index) => {
      console.log(`表格 ${index + 1}:`);
      console.log('  表头:', table.headers.join(' | '));
      console.log('  行数:', table.rows.length);
      if (table.rows.length > 0) {
        console.log('  第一行示例:', table.rows[0].join(' | '));
      }
      console.log('');
    });
    
    // 4. 生成第一个表格的 XML
    if (tables.length > 0) {
      console.log('🔧 生成 Word 表格 XML...');
      const tableXML = createWordTableXML(tables[0].headers, tables[0].rows, 9000);
      console.log('✅ XML 生成成功，长度:', tableXML.length, '字符');
      console.log('\nXML 预览（前 500 字符）:');
      console.log(tableXML.substring(0, 500));
      console.log('...\n');
    }
    
    // 5. 测试完整的简报生成
    console.log('🚀 测试完整简报生成...');
    const { generateBriefDocument } = await import('./lib/server/brief-generator');
    
    // 读取占位符映射
    const mappingPath = path.join(__dirname, 'data', 'placeholder-mapping.json');
    const mappingData = JSON.parse(await fs.readFile(mappingPath, 'utf-8'));
    
    // 模板路径
    const templatePath = path.join(__dirname, 'data', 'GuaranteeBusinessTemplate.docx');
    
    // 检查模板是否存在
    try {
      await fs.access(templatePath);
      console.log('✅ 模板文件存在');
      
      // 生成文档
      console.log('⚙️  正在生成 Word 文档...');
      const buffer = await generateBriefDocument(templatePath, mappingData);
      
      // 保存测试输出
      const outputPath = path.join(__dirname, 'test-brief-output.docx');
      await fs.writeFile(outputPath, buffer);
      
      console.log('✅ 生成成功！');
      console.log('📁 输出文件:', outputPath);
      console.log('📦 文件大小:', (buffer.length / 1024).toFixed(2), 'KB\n');
      
    } catch (error) {
      console.warn('⚠️  模板文件不存在，跳过完整测试');
      console.warn('提示：请将 Word 模板保存为 data/GuaranteeBusinessTemplate.docx\n');
    }
    
    console.log('=== 测试完成 ===');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  }
}

// 运行测试
testTableGeneration().catch(console.error);
