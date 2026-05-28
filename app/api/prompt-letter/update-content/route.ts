import { NextRequest } from 'next/server';
import { updateGeneratedPromptLetter } from '@/lib/server/prompt-letter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { institutionName, content } = body;

    if (!institutionName || !content) {
      return Response.json(
        { error: '缺少机构名称或内容' },
        { status: 400 }
      );
    }

    const success = await updateGeneratedPromptLetter(institutionName, content);

    if (!success) {
      return Response.json(
        { error: '未找到对应的提示函' },
        { status: 404 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('更新提示函内容时出错:', error);
    return Response.json(
      { error: '更新失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}
