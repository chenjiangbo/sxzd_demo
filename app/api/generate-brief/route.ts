import { NextResponse } from 'next/server';
import { generateBriefHTML } from '@/lib/server/brief-html-generator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { period, periodText, year } = body;

    console.log('生成 HTML 简报:', { period, periodText, year });

    // 创建 ReadableStream 用于流式输出
    const encoder = new TextEncoder();
    let resolveReady: () => void;
    const readyPromise = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送状态更新
          const sendStatus = (text: string) => {
            controller.enqueue(encoder.encode(`event: status\ndata: ${JSON.stringify({ text })}\n\n`));
          };

          const sendChunk = (text: string) => {
            controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify({ text })}\n\n`));
          };

          const sendComplete = (text: string, cached = false) => {
            controller.enqueue(encoder.encode(`event: complete\ndata: ${JSON.stringify({ text, cached })}\n\n`));
            controller.close();
          };

          sendStatus('正在准备数据源...');
          await new Promise((resolve) => setTimeout(resolve, 300));

          sendStatus('正在读取 CSV 数据和模板...');
          await new Promise((resolve) => setTimeout(resolve, 500));

          sendStatus('正在渲染 HTML 表格...');
          
          console.log('开始调用 generateBriefHTML...');
          // 生成完整 HTML
          const html = await generateBriefHTML(periodText || `${year}年${period === 'first-half' ? '上半年' : '下半年'}`);
          console.log('generateBriefHTML 返回:', html ? `长度=${html.length}` : 'undefined');
          
          if (!html) {
            throw new Error('generateBriefHTML 返回了空值');
          }
          
          sendStatus('正在整理排版...');
          await new Promise((resolve) => setTimeout(resolve, 200));

          // 分块发送 HTML 内容（模拟逐段生成）
          const chunkSize = 200;
          for (let i = 0; i < html.length; i += chunkSize) {
            const chunk = html.slice(i, i + chunkSize);
            sendChunk(chunk);
            await new Promise((resolve) => setTimeout(resolve, 15));
          }

          sendComplete(html);
        } catch (error) {
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ message: error instanceof Error ? error.message : '生成失败' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
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
