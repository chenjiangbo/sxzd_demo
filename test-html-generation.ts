import { generateBriefHTML } from './lib/server/brief-html-generator';
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function testHTMLGeneration() {
  try {
    console.log('=== 开始测试 HTML 简报生成 ===\n');
    
    // 1. 生成 HTML
    console.log('📄 生成 HTML 简报...');
    const html = await generateBriefHTML('2026 年上半年');
    
    console.log('✅ HTML 生成成功！');
    console.log('📊 HTML 大小:', html.length, '字节\n');
    
    // 2. 保存 HTML 文件
    const outputPath = path.join(__dirname, 'test-brief-output.html');
    await fs.writeFile(outputPath, html, 'utf-8');
    
    console.log('💾 文件已保存到:', outputPath);
    console.log('🌐 请在浏览器中打开查看效果\n');
    console.log(`👉 运行：start ${outputPath}\n`);
    
    // 3. 打印 HTML 预览（前 1000 字符）
    console.log('📋 HTML 预览（前 1000 字符）:');
    console.log('='.repeat(80));
    console.log(html.substring(0, 1000));
    console.log('...\n');
    console.log('='.repeat(80));
    
    console.log('\n✅ 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  }
}

// 运行测试
testHTMLGeneration().catch(console.error);
