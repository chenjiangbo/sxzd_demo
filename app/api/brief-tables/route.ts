import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

function splitCSVToTables(csvContent: string) {
  const sections = csvContent.split(/\n\s*\n/).filter(section => section.trim().length > 0);
  const tables: Array<{ headers: string[]; rows: string[][] }> = [];
  
  for (const section of sections) {
    const lines = section.split('\n').filter(line => line.trim());
    if (lines.length < 1) continue;
    
    // 解析表头（移除 BOM）
    const headers = lines[0].replace(/^\ufeff/, '').split(',').map(h => h.trim());
    
    // 检查是否有第二行表头（说明行）
    let dataStartIndex = 1;
    if (lines.length > 1 && lines[1] && !lines[1].match(/^\d/) && lines[1].includes(',')) {
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
    
    if (headers.length > 0) {
      tables.push({ headers, rows });
    }
  }
  
  return tables;
}

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'data', 'GuaranteeBusinessBriefTableData.csv');
    console.log('[API] 读取 CSV 文件:', csvPath);
    
    if (!fs.existsSync(csvPath)) {
      console.error('[API] CSV 文件不存在:', csvPath);
      return NextResponse.json([]);
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    console.log('[API] CSV 文件读取成功，长度:', csvContent.length);
    
    const tables = splitCSVToTables(csvContent);
    console.log('[API] CSV 解析完成，共', tables.length, '个表格');

    const tableNames = [
      '合作担保机构全口径新增担保业务规模统计表',
      '担保机构再担保业务统计表',
      '合作银行业务统计表',
      '再担保业务综合融资成本统计表',
      '银行参与分险再担保业务统计表',
      '合作银行分险业务统计表',
      '地市银行参与分险业务规模统计表',
      '国担基金"总对总"批量担保业务统计表',
      '地方版"总对总"批量担保业务统计表',
      '合作银行"总对总"批量担保业务统计表',
      '创业担保贷款再担保业务统计表',
      '"科技创新专项担保计划"业务统计表',
    ];

    const result = tables.map((table, index) => ({
      name: tableNames[index] || `表${index + 1}`,
      caption: `表${index + 1}：${tableNames[index] || ''}`,
      headers: table.headers || [],
      rows: table.rows || [],
    }));

    console.log('[API] 返回', result.length, '个表格');
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] 获取简报表格数据失败:', error);
    return NextResponse.json([]);
  }
}
