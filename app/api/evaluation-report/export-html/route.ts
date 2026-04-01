import { NextRequest, NextResponse } from 'next/server';
import { getEvaluationReportData } from '@/lib/server/evaluation-report';
import { renderEvaluationReportHtml } from '@/lib/server/evaluation-report-html';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const institutionId = searchParams.get('id');
  
  if (!institutionId) {
    return NextResponse.json({ error: '缺少机构 ID' }, { status: 400 });
  }
  
  try {
    // 获取机构数据
    const data = await getEvaluationReportData();
    const institution = data.institutions.find(i => i.id === institutionId);
    
    if (!institution) {
      return NextResponse.json({ error: '未找到该机构' }, { status: 404 });
    }
    
    // 构建报告数据（这里先用模板数据，实际应该从大模型获取）
    const reportText = `陕西省政府性融资担保机构综合评价报告

机构名称：${institution.name}
调查部门：业务一部
调查人员：
约谈对象：
调查时间：2026 年${new Date().getMonth() + 1}月${new Date().getDate()}日

一、经营情况变化及分析
${institution.name}（以下简称${institution.shortName}）成立于 XXXX 年 X 月，注册资本 XX 亿元。法定代表人 XXX，控股股东为 XXX（持股比例 XX%）。
截至 2025 年 12 月末，${institution.shortName}在保余额${institution.actualScale.toFixed(2)}亿元，在保户数 XXXX 户，净资产 XX 亿元。我司对${institution.shortName}本年度评价等次为"${institution.overallStatus}"，对应评价结果为${institution.overallStatus === '优秀' ? '优秀' : '合格'}类。
本次评价期内，${institution.shortName}法人治理结构、股权结构、法定代表人、主要管理层和对外投资等关键经营情况未发生变化。

二、年度政策目标完成情况
2025 年我司为${institution.shortName}下达了 8 项年度业务合作政策目标，各指标详情及 12 月底进度情况如下：
单位：亿元、倍、%

三、授信使用及业务开展
本年度我司授予${institution.shortName}再担保业务授信额度 XX 亿元。截至 12 月 31 日，${institution.shortName}使用再担保业务总授信额度 XX 亿元，授信使用率 XX%。

四、结论
${institution.name}本次评价期内经营状况稳定，建议评定为"${institution.overallStatus}"类。`;

    // 渲染 HTML
    const htmlContent = renderEvaluationReportHtml({
      rawText: reportText,
      generatedAt: new Date().toISOString(),
      institutionId,
      institutionName: institution.name,
    });
    
    // 将 HTML 转换为 Word 文档（MHTML 格式）
    // Word 可以直接打开 HTML 格式的文档并保存为.doc
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/msword',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(institution.name)}评价报告.doc"`,
      },
    });
  } catch (error) {
    console.error('Word 导出失败:', error);
    return NextResponse.json(
      { error: 'Word 导出失败' },
      { status: 500 }
    );
  }
}
