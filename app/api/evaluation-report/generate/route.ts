import { NextRequest, NextResponse } from 'next/server';
import { getEvaluationReportData } from '@/lib/server/evaluation-report';
import { renderEvaluationReportBodyHtml } from '@/lib/server/evaluation-report-html';
import { generateEvaluationReportDocument } from '@/lib/server/evaluation-report-generation';

function splitHtmlIntoChunks(html: string) {
  const chunks: string[] = [];
  let cursor = 0;
  const targetSize = 720;

  while (cursor < html.length) {
    let next = Math.min(cursor + targetSize, html.length);

    if (next < html.length) {
      const safeBoundary = html.indexOf('>', next);
      if (safeBoundary !== -1) {
        next = safeBoundary + 1;
      }
    }

    chunks.push(html.slice(cursor, next));
    cursor = next;
  }

  return chunks.filter(Boolean);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const institutionId = body.institutionId as string | undefined;
  const force = body.force === true;

  if (!institutionId) {
    return NextResponse.json({ error: '缺少机构 ID' }, { status: 400 });
  }

  try {
    const data = await getEvaluationReportData();
    const institution = data.institutions.find((item) => item.id === institutionId);

    if (!institution) {
      return NextResponse.json({ error: '未找到该机构' }, { status: 404 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (type: string, data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
        };

        try {
          send('status', { text: `正在读取 ${institution.shortName} 的评价指标数据...` });
          
          // 启动 AI 生成,并定期发送心跳
          send('status', { text: `正在调用 AI 生成 ${institution.shortName} 的评价正文...` });
          
          // 创建心跳定时器,每10秒发送一次保持连接活跃
          const heartbeatInterval = setInterval(() => {
            send('status', { text: `AI 正在思考中... (${Math.floor(Date.now() / 1000) % 60}s)` });
          }, 10000);
          
          let document;
          try {
            document = await generateEvaluationReportDocument(institution, force);
          } finally {
            clearInterval(heartbeatInterval);
          }
          
          send('status', { text: '正在按保后评价报告 Word 模板排版...' });
          const html = renderEvaluationReportBodyHtml(document);
          const chunks = splitHtmlIntoChunks(html);
          send('status', { text: '正在逐段输出报告预览...' });
          for (const chunk of chunks) {
            send('chunk', { html: chunk });
            await new Promise((resolve) => setTimeout(resolve, 90));
          }
          send('complete', {
            institutionId,
            institutionName: institution.name,
            indicators: {
              overallStatus: institution.overallStatus,
              scaleCompletionRate: institution.scaleCompletionRate,
              customerRatioCompletionRate: institution.customerRatioCompletionRate,
              compensationRateStatus: institution.compensationRateStatus,
            },
          });
          controller.close();
        } catch (error) {
          send('error', { message: (error as Error).message });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: `评价报告生成失败：${(error as Error).message}` },
      { status: 500 },
    );
  }
}
