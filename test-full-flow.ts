// 完整测试 CSV 解析和 HTML 生成
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function test() {
  const csvPath = path.join(process.cwd(), 'data', 'GuaranteeBusinessBriefTableData.csv');
  const content = await fs.readFile(csvPath, 'utf-8');
  
  console.log('=== 步骤 1: CSV 内容 ===');
  console.log(content.substring(0, 500));
  console.log('...\n');
  
  // 解析 CSV
  const cleanContent = content.replace(/^\uFEFF/, '');
  const lines = cleanContent.split('\n').filter(line => line.trim());
  
  console.log('=== 步骤 2: 解析行数 ===');
  console.log(`总行数：${lines.length}`);
  console.log('前 5 行:', lines.slice(0, 5).join('\n'));
  console.log('...\n');
  
  // 解析表格
  const tables: Record<string, any[]> = {};
  let currentTable: { name: string; headers: string[]; rows: any[] } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    if (line.includes('序号')) {
      // 先将中文逗号替换为英文逗号，并移除逗号后的空格，再分割
      const normalizedLine = line.replace(/,/g, ',').replace(/,\s+/g, ',');
      const headers = normalizedLine.split(',').map(h => h.trim());
      console.log(`\n=== 检测到表头 ${i} ===`);
      console.log('表头:', headers);
      console.log('表头数量:', headers.length);
      
      // 简单的表名判断
      let tableName = null;
      const headerStr = headers.join('');
      if (headerStr.includes('银行')) tableName = 'bank_table';
      else if (headerStr.includes('担保机构') && headerStr.includes('再担保')) tableName = 're_guarantee_table';
      else if (headerStr.includes('担保机构')) tableName = 'inst_table';
      else if (headerStr.includes('费率')) tableName = 'cost_table';
      else if (headerStr.includes('分险')) tableName = 'risk_table';
      
      if (tableName) {
        currentTable = { name: tableName, headers, rows: [] };
        tables[tableName] = [];
        console.log(`表格名称：${tableName}`);
      }
    } else if (currentTable && (line.match(/^\d/) || line.includes('合计'))) {
      const values = line.split(/,\s*/).map(v => v.trim());
      console.log(`数据行：${values.join(' | ')}`);
      
      const row: any = {};
      currentTable.headers.forEach((header, index) => {
        let key = header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        row[key] = values[index] || '';
      });
      
      currentTable.rows.push(row);
      tables[currentTable.name] = currentTable.rows;
    }
  }
  
  console.log('\n=== 步骤 3: 解析到的表格 ===');
  console.log('表格列表:', Object.keys(tables));
  
  console.log('\n=== 步骤 4: 第一个表格数据 ===');
  const firstTable = tables[Object.keys(tables)[0]];
  if (firstTable) {
    console.log('表格名称:', Object.keys(tables)[0]);
    console.log('数据行数:', firstTable.length);
    console.log('第一行数据:', firstTable[0]);
  }
  
  console.log('\n=== 步骤 5: 转换为 HTML ===');
  if (firstTable && firstTable.length > 0) {
    const headers = Object.keys(firstTable[0]);
    let html = '<table>\n<tr>';
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr>\n';
    
    firstTable.forEach(row => {
      html += '<tr>';
      headers.forEach(h => html += `<td>${row[h]}</td>`);
      html += '</tr>\n';
    });
    
    html += '</table>';
    console.log('HTML 预览:', html.substring(0, 300));
  }
}

test().catch(console.error);
