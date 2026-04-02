import path from 'node:path';
import { promises as fs } from 'node:fs';
import * as XLSX from 'xlsx';

async function testEvaluationData() {
  const WORKSPACE_ROOT = process.cwd();
  const EVALUATION_DOC_DIR = path.join(WORKSPACE_ROOT, 'docs', '机构评价');
  const EVALUATION_SPREADSHEET = path.join(EVALUATION_DOC_DIR, 'evaluation-report-2026-04-01.xls');
  
  console.log('工作目录:', WORKSPACE_ROOT);
  console.log('Excel 路径:', EVALUATION_SPREADSHEET);
  
  try {
    // 检查文件是否存在
    await fs.access(EVALUATION_SPREADSHEET);
    console.log('✅ Excel 文件存在');
    
    // 读取文件
    const workbookBuffer = await fs.readFile(EVALUATION_SPREADSHEET);
    console.log('✅ 文件读取成功，大小:', workbookBuffer.length, 'bytes');
    
    // 解析 Excel
    const workbook = XLSX.read(workbookBuffer, { type: 'buffer' });
    console.log('✅ Excel 解析成功');
    console.log('工作表数量:', workbook.SheetNames.length);
    console.log('工作表名称:', workbook.SheetNames);
    
    // 读取第一个工作表
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log('\n工作表原始内容:');
    console.log('Sheet:', sheetName);
    console.log('Worksheet keys:', Object.keys(worksheet).slice(0, 20));
    
    // 尝试不同的解析方式
    const rows = XLSX.utils.sheet_to_json<Array<string | number | null>>(worksheet, {
      header: 1,
      defval: '',
      raw: false,
      range: 14, // 从第 15 行开始 (0-based)
    });
    
    console.log('\n总行数:', rows.length);
    console.log('\n前 5 行数据:');
    rows.slice(0, 5).forEach((row, index) => {
      console.log(`行${index}:`, row.filter(cell => cell !== '').slice(0, 10)); // 只显示非空单元格
    });
    
    // 检查数据行（跳过前 3 行表头，从第 4 行开始是数据）
    const dataRows = rows.slice(3).filter((row) => {
      const nameCell = row[1];
      return nameCell && typeof nameCell === 'string' && nameCell.trim().length > 0;
    });
    console.log('\n有效数据行数:', dataRows.length);
    
    if (dataRows.length > 0) {
      console.log('\n第一条完整数据:');
      const firstRow = dataRows[0];
      console.log('序号:', firstRow[0]);
      console.log('机构名称:', firstRow[1]);
      console.log('目标规模:', firstRow[2]);
      console.log('实际完成:', firstRow[3]);
      console.log('8 项指标列位置:');
      console.log('  - 客户占比目标:', firstRow[4]);
      console.log('  - 客户占比实际:', firstRow[5]);
      console.log('  - 再担保目标:', firstRow[6]);
      console.log('  - 再担保实际:', firstRow[7]);
      console.log('  - 分险目标:', firstRow[8]);
      console.log('  - 分险实际:', firstRow[9]);
      console.log('  - 杠杆目标:', firstRow[10]);
      console.log('  - 杠杆实际:', firstRow[11]);
      console.log('  - 代偿率目标:', firstRow[12]);
      console.log('  - 代偿率实际:', firstRow[13]);
      console.log('  - 代偿状态:', firstRow[14]);
      console.log('  - 返还率目标:', firstRow[15]);
      console.log('  - 返还率实际:', firstRow[16]);
      console.log('  - 备案率:', firstRow[17]);
      console.log('  - 政策打分:', firstRow[18]);
    }
    
    console.log('\n✅ 数据验证成功！Excel 可以正常读取');
  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  }
}

testEvaluationData().catch(console.error);
