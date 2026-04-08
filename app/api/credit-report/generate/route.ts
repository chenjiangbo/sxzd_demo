import { NextRequest, NextResponse } from 'next/server';
import { generateCreditReportWithTrace, getGeneratedCreditReport, writeGeneratedCreditReport } from '@/lib/server/credit-report-draft';

function createSseMessage(event: string, data: Record<string, unknown>) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const force = body && typeof body.force === 'boolean' ? body.force : false;

  if (!force) {
    const cached = await getGeneratedCreditReport();
    if (cached) {
      return new NextResponse(createSseMessage('complete', { text: cached.rawText, cached: true, dataTrace: cached.dataTrace }), {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }
  }

  try {
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(createSseMessage(event, data)));
        };

        send('status', { text: '正在整理授信基础数据...' });

        try {
          send('status', { text: '正在调用模型生成授信报告与数据核验映射...' });
          const generated = await generateCreditReportWithTrace();
          const saved = await writeGeneratedCreditReport({
            rawText: generated.report_text,
            dataTrace: generated.data_trace,
          });
          send('complete', { text: saved.rawText, cached: false, dataTrace: saved.dataTrace });
          controller.close();
        } catch (error) {
          send('error', { message: (error as Error).message || '授信报告生成失败' });
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: (error as Error).message || '授信报告生成失败',
      },
      { status: 500 },
    );
  }
}
