import { NextRequest, NextResponse } from 'next/server';
import { getGeneratedPromptLetter } from '@/lib/server/prompt-letter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName') || '综合评价提示函';

    const letter = await getGeneratedPromptLetter();
    
    if (!letter) {
      return NextResponse.json(
        { error: '未找到生成的提示函，请先生成提示函' },
        { status: 404 }
      );
    }

    // 创建简单的HTML格式文档
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${fileName}</title>
  <style>
    body {
      font-family: 'SimSun', '宋体', serif;
      line-height: 2;
      margin: 5%;
      background: white;
      font-size: 16px;
    }
    .center {
      text-align: center;
    }
    .right {
      text-align: right;
    }
    .indent {
      text-indent: 2em;
    }
    h1 {
      font-size: 18px;
      font-weight: bold;
    }
  </style>
</head>
<body>
${letter.rawText
  .split('\n')
  .map(line => {
    if (line.trim() === '') return '<br>';
    if (line.includes('关于') && line.includes('综合评价的提示函')) {
      return `<div class="center"><h1>${line.trim()}</h1></div>`;
    }
    if (line.includes('陕西省信用再担保有限责任公司') || 
        line.includes('总经理') || 
        line.match(/(\d{4}年\d{1,2}月|\d{4}年\d{1,2}月\d{1,2}日)/)) {
      return `<div class="right">${line.trim()}</div>`;
    }
    if (line.match(/^.*?[：:]$/)) {
      return `<p><strong>${line.trim()}</strong></p>`;
    }
    if (line.match(/^一、|^二、|^三、|^四、|^五、|^六、|^七、|^八、|^九、|^十、/)) {
      return `<p><strong>${line.trim()}</strong></p>`;
    }
    return `<p class="indent">${line.trim()}</p>`;
  })
  .join('\n')}
</body>
</html>`;

    // 将HTML转换为Buffer
    const buffer = Buffer.from(htmlContent, 'utf-8');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName + '.html')}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('导出提示函时出错:', error);
    return NextResponse.json(
      { error: '导出失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}