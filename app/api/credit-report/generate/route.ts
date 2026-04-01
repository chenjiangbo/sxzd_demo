import { NextRequest, NextResponse } from 'next/server';
import { createBlackwhiteChatResponse } from '@/lib/server/blackwhite';
import { buildCreditReportMessages, getGeneratedCreditReport, writeGeneratedCreditReport } from '@/lib/server/credit-report-draft';

function createSseMessage(event: string, data: Record<string, unknown>) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function extractDeltaContent(payload: string) {
  try {
    const parsed = JSON.parse(payload) as {
      choices?: Array<{
        delta?: {
          content?: string | Array<{ type?: string; text?: string }>;
        };
      }>;
    };

    const delta = parsed.choices?.[0]?.delta?.content;
    if (typeof delta === 'string') {
      return delta;
    }
    if (Array.isArray(delta)) {
      return delta
        .map((item) => (item && typeof item.text === 'string' ? item.text : ''))
        .join('');
    }
    return '';
  } catch {
    return '';
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const force = body && typeof body.force === 'boolean' ? body.force : false;

  if (!force) {
    const cached = await getGeneratedCreditReport();
    if (cached) {
      return new NextResponse(createSseMessage('complete', { text: cached.rawText, cached: true }), {
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
    const messages = await buildCreditReportMessages();
    const upstream = await createBlackwhiteChatResponse(messages, {
      temperature: 0.2,
      timeoutMs: 180_000,
      stream: true,
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `授信报告生成失败：${upstream.status} ${await upstream.text()}` },
        { status: 500 },
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = upstream.body!.getReader();
        let accumulated = '';
        let buffer = '';

        const send = (event: string, data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(createSseMessage(event, data)));
        };

        send('status', { text: '正在调用模型生成授信报告...' });

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const frames = buffer.split('\n\n');
            buffer = frames.pop() ?? '';

            for (const frame of frames) {
              const lines = frame.split('\n');
              for (const line of lines) {
                if (!line.startsWith('data:')) continue;
                const payload = line.slice(5).trim();
                if (!payload) continue;
                if (payload === '[DONE]') {
                  continue;
                }

                const text = extractDeltaContent(payload);
                if (!text) continue;

                accumulated += text;
                send('chunk', { text });
              }
            }
          }

          const finalText = accumulated.trim();
          if (!finalText) {
            throw new Error('模型未返回有效的授信报告正文');
          }

          const saved = await writeGeneratedCreditReport(finalText);
          send('complete', { text: saved.rawText, cached: false });
          controller.close();
        } catch (error) {
          send('error', { message: (error as Error).message || '授信报告生成失败' });
          controller.close();
        } finally {
          reader.releaseLock();
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
