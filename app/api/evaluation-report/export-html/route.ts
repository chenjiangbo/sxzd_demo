import { NextRequest, NextResponse } from 'next/server';
import { getEvaluationReportData } from '@/lib/server/evaluation-report';
import { renderEvaluationReportHtml } from '@/lib/server/evaluation-report-html';
import { generateEvaluationReportDocument } from '@/lib/server/evaluation-report-generation';

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
    
    const document = await generateEvaluationReportDocument(institution);
    const htmlContent = renderEvaluationReportHtml(document);
    
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
