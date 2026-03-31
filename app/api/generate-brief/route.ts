import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

// 模拟的占位符映射数据（实际应该从 JSON 文件读取）
const placeholderMapping = {
  placeholders: {
    single_indicators: {
      '{{report_title}}': '业务一部担保业务简报',
      '{{report_period}}': '2026 年上半年',
      '{{total_balance}}': '125.6 亿元',
      '{{total_balance_growth}}': '8.5%',
      '{{total_accounts}}': '1,245 户',
      '{{total_accounts_growth}}': '12.3%',
      '{{total_guarantee_amount}}': '89.3 亿元',
      '{{total_guarantee_growth}}': '15.7%',
      '{{average_rate}}': '1.8%',
      '{{rate_change}}': '-0.2%',
      '{{compensation_amount}}': '3,456 万元',
      '{{compensation_growth}}': '12.5%',
      '{{compensation_rate}}': '2.75%',
      '{{overdue_rate}}': '3.12%',
      '{{recovery_amount}}': '1,234 万元',
      '{{recovery_rate}}': '35.7%',
      '{{reserve_amount}}': '15,678 万元',
      '{{reserve_ratio}}': '1%',
      '{{reserve_adequacy}}': '125%',
      '{{business_income}}': '12,345 万元',
      '{{income_growth}}': '15.6%',
      '{{profit_margin}}': '28.5%',
      '{{roe}}': '8.9%',
      '{{net_profit}}': '6,789 万元',
      '{{profit_growth}}': '18.9%',
    },
    table_placeholders: {
      '{{table_overview}}': 'table_1',
      '{{table_product_structure}}': 'table_2',
      '{{table_industry_structure}}': 'table_3',
      '{{table_region_structure}}': 'table_4',
      '{{table_bank_cooperation}}': 'table_5',
      '{{table_compensation}}': 'table_6',
      '{{table_recovery}}': 'table_7',
      '{{table_reserve}}': 'table_8',
      '{{table_benefit}}': 'table_9',
      '{{table_new_business}}': 'table_10',
      '{{table_customer}}': 'table_11',
      '{{table_reinsurance}}': 'table_12',
    },
  },
};

// 模拟的表格数据
const tablesData = {
  table_1: [
    ['指标', '数值', '增长'],
    ['在保余额', '125.6 亿元', '8.5%'],
    ['在保户数', '1,245 户', '12.3%'],
    ['累计担保发生额', '89.3 亿元', '15.7%'],
    ['平均担保费率', '1.8%', '-0.2%'],
  ],
  table_2: [
    ['产品类型', '在保余额', '占比', '户数'],
    ['流动资金贷款担保', '45.2 亿元', '36.0%', '423'],
    ['固定资产贷款担保', '38.7 亿元', '30.8%', '189'],
    ['银行承兑汇票担保', '22.4 亿元', '17.8%', '356'],
    ['其他担保产品', '19.3 亿元', '15.4%', '277'],
  ],
  // ... 其他表格数据
};

/**
 * 填充 Word 模板中的占位符
 * 注意：这是一个简化版本，实际需要使用 docxtemplater 或类似库
 */
async function fillWordTemplate(
  templatePath: string,
  indicators: Record<string, string>,
  tables: Record<string, any[][]>
): Promise<Buffer> {
  // TODO: 使用 docxtemplater 库处理真实的 Word 文档
  // 这里返回一个模拟的 buffer
  
  console.log('填充模板:', templatePath);
  console.log('指标数据:', indicators);
  console.log('表格数据:', Object.keys(tables).length, '个表格');
  
  // 实际实现时应该：
  // 1. 读取 Word 模板文件
  // 2. 使用 docxtemplater 替换所有占位符
  // 3. 将表格数据插入到指定位置
  // 4. 生成新的 Word 文档并返回 buffer
  
  // 临时返回一个空的 buffer 用于测试
  return Buffer.from('模拟的 Word 文档内容 - 实际需要使用 docxtemplater 库处理');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { period, periodText, year } = body;

    console.log('生成简报:', { period, periodText, year });

    // 1. 读取占位符映射数据
    const indicators = {
      ...placeholderMapping.placeholders.single_indicators,
      '{{report_period}}': periodText, // 根据选择的期间更新
    };

    // 2. 准备表格数据
    const tables = tablesData;

    // 3. 找到 Word 模板文件路径
    const templatePath = path.join(process.cwd(), 'templates', 'brief-template.docx');
    
    // 检查模板文件是否存在
    try {
      await fs.access(templatePath);
    } catch (error) {
      console.warn('模板文件不存在，使用模拟数据:', templatePath);
      // 继续执行，使用模拟数据
    }

    // 4. 填充模板生成 Word 文档
    const docBuffer = await fillWordTemplate(templatePath, indicators, tables);

    // 5. 返回生成的文档
    return new NextResponse(docBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="业务一部担保业务简报-${periodText}.docx"`,
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
