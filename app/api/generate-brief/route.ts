import { NextResponse } from 'next/server';
import { generateBriefHTML } from '@/lib/server/brief-html-generator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { period, periodText, year } = body;

    console.log('生成 HTML 简报:', { period, periodText, year });

    // 使用 HTML 方案生成简报
    const html = await generateBriefHTML(periodText || `${year}年${period === 'first-half' ? '上半年' : '下半年'}`);

    // 返回 HTML 文件
    const filename = `担保业务简报-${periodText || '最新'}.html`;
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename).replace(/'/g, '%27')}"`,
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
