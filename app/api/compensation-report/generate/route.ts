import { NextRequest, NextResponse } from 'next/server';
import { generateCompensationApprovalReport, getGeneratedCompensationReport } from '@/lib/server/compensation-approval-report';
import { REVEAL_ORDER } from '@/lib/compensation-report-format';

function createSseMessage(event: string, data: Record<string, unknown>) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const force = body && typeof body.force === 'boolean' ? body.force : false;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(createSseMessage(event, data)));
      };

      try {
        if (!force) {
          const cached = await getGeneratedCompensationReport();
          if (cached) {
            send('status', { text: '已命中审批表缓存，正在载入最新版本...' });
            for (let index = 0; index < REVEAL_ORDER.length; index += 1) {
              send('chunk', { report: cached, revealCount: index + 1, cached: true });
              await sleep(120);
            }
            send('complete', { report: cached, cached: true });
            controller.close();
            return;
          }
        }

        send('status', { text: '正在汇总材料清单、规则结果与关键金额口径...' });
        const { report, cached } = await generateCompensationApprovalReport(force);
        send('status', { text: '正在整理审批表结构并写入正文版式...' });
        for (let index = 0; index < REVEAL_ORDER.length; index += 1) {
          send('chunk', { report, revealCount: index + 1, cached });
          await sleep(180);
        }
        send('complete', { report, cached });
        controller.close();
      } catch (error) {
        send('error', { message: (error as Error).message || '代偿补偿审批表生成失败' });
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
}
