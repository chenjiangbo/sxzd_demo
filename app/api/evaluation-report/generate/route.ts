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

    // 构建提示词 - 让大模型学习模板风格
    const prompt = `你是一名专业的担保机构评价报告撰写专家。请根据以下机构数据，按照陕西省政府性融资担保机构综合评价报告的标准格式，撰写一份专业、客观的年度评价报告。

## 机构数据信息
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

## 报告格式要求

请严格按照以下结构和文风撰写（参考陕西省政府性融资担保机构综合评价报告标准模板）：

**标题页**：
陕西省政府性融资担保机构综合评价报告

机构名称：{机构全称}
调查部门：业务一部
调查人员：（留空）
约谈对象：（留空）
调查时间：2026 年 X 月 X 日（当前日期）

**一、经营情况变化及分析**
{机构全称}（以下简称{简称}）成立于 XXXX 年 X 月，注册资本 XX 亿元。法定代表人 XXX，控股股东为 XXX（持股比例 XX%）。
截至 2025 年 12 月末，{简称}在保余额 XX 亿元，在保户数 XXXX 户，净资产 XX 亿元。我司对{简称}本年度评价等次为"{评价等次}"，对应评价结果为{优秀/合格/关注}类。
本次评价期内，{简称}法人治理结构、股权结构、法定代表人、主要管理层和对外投资等关键经营情况{未发生变化/除 XXX 外未发生变化}。

**二、年度政策目标完成情况**
2025 年我司为{简称}下达了 8 项年度业务合作政策目标，各指标详情及 12 月底进度情况如下：
单位：亿元、倍、%
（此处生成一个完整的表格，包含 8 项指标的目标值、实际值、完成进度）
从{简称}1-12 月主要合作政策目标完成进度分析，{详细描述各项指标完成情况，包括达标情况和未达标原因分析}。主要原因为{深入分析宏观经济、行业环境、公司经营策略等因素}。

**三、授信使用及业务开展**
本年度我司授予{简称}再担保业务授信额度 XX 亿元，其中银担非分险业务授信 XX 亿元。截至 12 月 31 日，{简称}使用再担保业务总授信额度 XX 亿元，使用银担非分险业务授信额度 XX 亿元，授信使用率分别为 XX%和 XX%。
截至 12 月 31 日，{简称}累计申请代偿补偿项目 XX 笔，获得补偿资金 XX 万元，累计回收金额 XX 万元，补偿款返还率 XX%。
目前，{简称}备案业务主要分为传统业务和总对总批量担保业务两大类，具体产品构成如下表：
单位：万元
（此处生成一个业务分类表格，包含业务分类、业务规模、占比）

**四、结论**
{简称}本次评价期内{总体评价}，主要受{主要影响因素}影响，{具体描述}。{代偿率/风险管控}情况{评价}。建议评定为"{建议类别}"，并{后续建议}。

请使用专业、客观、正式的公文语言，数据准确，分析深入，建议具有针对性和可操作性。字数控制在 2000-3000 字。`;

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
