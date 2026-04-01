import { NextRequest, NextResponse } from 'next/server';
import { createBlackwhiteChatResponse } from '@/lib/server/blackwhite';
import { getEvaluationReportData } from '@/lib/server/evaluation-report';

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
  const institutionId = body.institutionId as string | undefined;
  
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

    // 构建提示词
    const prompt = `你是一名专业的担保机构评价报告撰写专家。请根据以下机构数据，撰写一份专业、客观的年度评价报告。

## 机构基本信息
- 机构名称：${institution.name}（简称：${institution.shortName}）
- 区域层级：${institution.regionLevel}
- 信用评级：${institution.rating}

## 8 项核心政策指标完成情况

1. **新增担保业务规模**
   - 目标值：${institution.targetScale.toFixed(2)}亿元
   - 实际完成：${institution.actualScale.toFixed(2)}亿元
   - 完成率：${(institution.scaleCompletionRate * 100).toFixed(1)}%

2. **小微三农融资担保占比**
   - 目标值：${(institution.targetCustomerRatio * 100).toFixed(1)}%
   - 实际完成：${(institution.actualCustomerRatio * 100).toFixed(1)}%
   - 完成率：${(institution.customerRatioCompletionRate * 100).toFixed(1)}%

3. **再担保规模**
   - 目标值：${institution.targetReGuarantee.toFixed(2)}亿元
   - 实际完成：${institution.actualReGuarantee.toFixed(2)}亿元
   - 完成率：${(institution.reGuaranteeCompletionRate * 100).toFixed(1)}%

4. **分险业务占比**
   - 目标值：${(institution.targetRiskShare * 100).toFixed(1)}%
   - 实际完成：${(institution.actualRiskShare * 100).toFixed(1)}%
   - 完成率：${(institution.riskShareCompletionRate * 100).toFixed(1)}%

5. **担保放大倍数**
   - 目标值：${institution.targetLeverage.toFixed(2)}倍
   - 实际完成：${institution.actualLeverage.toFixed(2)}倍
   - 完成率：${(institution.leverageCompletionRate * 100).toFixed(1)}%

6. **代偿率控制**
   - 目标值：不超过${(institution.targetCompensationRate * 100).toFixed(2)}%
   - 实际完成：${(institution.actualCompensationRate * 100).toFixed(2)}%
   - 状态：${institution.compensationRateStatus}

7. **代偿返还率**
   - 目标值：${(institution.targetRecoveryRate * 100).toFixed(1)}%
   - 实际完成：${(institution.actualRecoveryRate * 100).toFixed(1)}%
   - 完成率：${(institution.recoveryRateCompletionRate * 100).toFixed(1)}%

8. **备案率**
   - 实际完成：${(institution.filingRate ? institution.filingRate * 100 : 0).toFixed(1)}%

## 综合评价结果
- 综合评价：${institution.overallStatus}
- 政策打分：${institution.policyScore.toFixed(1)}分

## 报告要求
请按照以下结构撰写评价报告（2000-3000 字）：

一、机构基本情况
简要介绍机构基本信息和整体经营情况。

二、政策目标完成情况分析
逐项分析 8 项核心指标的完成情况，包括：
- 与目标对比
- 完成进度评价
- 存在的主要问题和原因分析

三、主要特点和亮点
总结该机构在业务开展、风险控制、服务实体经济等方面的突出表现。

四、存在问题
客观指出该机构在指标完成、业务发展、风险管理等方面存在的问题和不足。

五、工作建议
针对该机构的综合评价等级（${institution.overallStatus}），提出具体的改进建议和发展方向。

请使用专业、客观的语言，数据准确，分析深入，建议具有针对性和可操作性。`;

    const messages = [
      { role: 'system', content: '你是一名专业的担保机构评价报告撰写专家，擅长根据数据撰写专业、客观的评价报告。' },
      { role: 'user', content: prompt },
    ];

    const upstream = await createBlackwhiteChatResponse(messages, {
      temperature: 0.3,
      timeoutMs: 180_000,
      stream: true,
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `评价报告生成失败：${upstream.status} ${await upstream.text()}` },
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

        send('status', { text: `正在调用模型生成${institution.shortName}评价报告...` });

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
            throw new Error('模型未返回有效的报告正文');
          }

          send('complete', { text: finalText, institutionId, institutionName: institution.name });
          controller.close();
        } catch (error) {
          send('error', { message: (error as Error).message || '报告生成失败' });
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
        error: (error as Error).message || '报告生成失败',
      },
      { status: 500 },
    );
  }
}
