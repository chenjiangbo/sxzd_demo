// 测试 CSV 解析和 HTML 生成
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function test() {
  // 1. 读取 CSV 文件
  const csvPath = path.join(process.cwd(), 'data', 'GuaranteeBusinessBriefTableData.csv');
  const content = await fs.readFile(csvPath, 'utf-8');

  console.log('=== 步骤 1: 读取 CSV 文件 ===');
  console.log('文件内容:');
  console.log(content);
  console.log('\n');

  // 2. 解析 CSV
  const cleanContent = content.replace(/^\uFEFF/, '');
  const lines = cleanContent.split('\n').filter(line => line.trim());

  console.log('=== 步骤 2: 解析 CSV 行 ===');
  console.log('总行数:', lines.length);
  lines.forEach((line, i) => {
    console.log(`行${i}: ${line}`);
  });
  console.log('\n');

  // 3. 检测表头
  console.log('=== 步骤 3: 检测表头 ===');
  const headers = lines.filter(line => line.includes('序号') && !line.includes('合计'));
  headers.forEach((h, i) => {
    console.log(`表头${i}: ${h}`);
  });
  console.log('\n');

  // 4. 测试第一个表格
  console.log('=== 步骤 4: 测试第一个表格数据 ===');
  const firstHeader = lines.find(line => line.includes('序号') && line.includes('银行'));
  if (firstHeader) {
    console.log('第一个表头:', firstHeader);
    const headerCells = firstHeader.split(',').map(h => h.trim());
    console.log('表头单元格:', headerCells);
    
    // 查找数据行
    const dataLines = lines.slice(lines.indexOf(firstHeader) + 1, lines.indexOf(firstHeader) + 4);
    console.log('数据行:');
    dataLines.forEach((line, i) => {
      if (line.trim()) {
        const cells = line.split(',').map(c => c.trim());
        console.log(`  行${i}: ${cells.join(' | ')}`);
      }
    });
  }
}

test().catch(console.error);
