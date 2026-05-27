import { NextRequest } from 'next/server';
import { getGeneratedPromptLetters } from '@/lib/server/prompt-letter';
import { generatePromptLetterDocx } from '@/lib/server/prompt-letter/docx-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName') || '综合评价提示函';
    const institutionName = searchParams.get('institutionName') || '';

    // 获取生成的提示函列表
    const letters = await getGeneratedPromptLetters();
    // 按机构名过滤，找不到就取最新的
    const letter = institutionName
      ? letters.find(l => l.institutionName === institutionName) || letters[0]
      : letters[0];

    if (!letter) {
      return Response.json(
        { error: '未找到生成的提示函，请先生成提示函' },
        { status: 404 }
      );
    }

    // 调用 docx 生成器，生成真实的 Word 文档（带字体、字号、行距、首行缩进等公文排版）
    const docxBuffer = await generatePromptLetterDocx(letter.rawText);

    // 文件名统一用 .docx
    const downloadName = `${letter.fileName || fileName}.docx`;

    return new Response(docxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
        'Content-Length': String(docxBuffer.length),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('导出提示函时出错:', error);
    return Response.json(
      { error: '导出失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}