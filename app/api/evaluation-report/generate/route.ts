import { NextRequest, NextResponse } from 'next/server';
import { createBlackwhiteChatResponse, type ChatMessage } from '@/lib/server/blackwhite';
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
   - 当前数据集中未提供备案率字段，请在报告中注明该指标暂未纳入本次量化评价

## 综合评价结果
- 综合评价：${institution.overallStatus}
- 政策打分：${institution.policyScore.toFixed(1)}分

## 报告格式要求

请严格按照以下结构和文风撰写（参考陕西省政府性融资担保机构综合评价报告标准模板），**使用 HTML 格式输出，使其看起来像一份正式的 Word 文档**：

**重要说明**：
- **整个报告必须用 HTML 代码编写**，但最终效果要和 Word 文档一样正式、规范
- **所有文字内容都用 HTML 标签包裹**（如 <p>、<div>、<h1> 等）
- **所有表格都必须用 HTML <table> 标签**，不要使用文本字符拼凑表格
- **使用内联 CSS 样式**控制字体、字号、间距、对齐等，确保在浏览器中显示效果与 Word 一致

**标题页（使用 HTML 格式）**：

<div style="text-align: center; padding: 40px 20px; font-family: 'SimSun', serif;">
  <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 40px;">陕西省政府性融资担保机构综合评价报告</h1>
  <div style="line-height: 2.5; text-align: left; max-width: 600px; margin: 0 auto;">
    <p><strong>机构名称：</strong>{机构全称}</p>
    <p><strong>调查部门：</strong>业务一部</p>
    <p><strong>调查人员：</strong></p>
    <p><strong>约谈对象：</strong></p>
    <p><strong>调查时间：</strong>2026 年 X 月 X 日</p>
  </div>
</div>

**一、经营情况变化及分析**
{机构全称}（以下简称 {简称}）成立于 XXXX 年 X 月，注册资本 XX 亿元。法定代表人 XXX，控股股东为 XXX（持股比例 XX%）。
截至 2025 年 12 月末，{简称}在保余额 XX 亿元，在保户数 XXXX 户，净资产 XX 亿元。我司对{简称}本年度评价等次为 "{评价等次}"，对应评价结果为{优秀/合格/关注}类。
本次评价期内，{简称}法人治理结构、股权结构、法定代表人、主要管理层和对外投资等关键经营情况{未发生变化/除 XXX 外未发生变化}。

**二、年度政策目标完成情况**
2025 年我司为{简称}下达了 8 项年度业务合作政策目标，各指标详情及 12 月底进度情况如下：

**必须生成 HTML 表格**，格式如下：

<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
  <thead>
    <tr style="background-color: #f0f0f0;">
      <th style="border: 1px solid #ccc; padding: 10px; text-align: center;">序号</th>
      <th style="border: 1px solid #ccc; padding: 10px; text-align: center;">评价指标</th>
      <th style="border: 1px solid #ccc; padding: 10px; text-align: center;">单位</th>
      <th style="border: 1px solid #ccc; padding: 10px; text-align: center;">目标值</th>
      <th style="border: 1px solid #ccc; padding: 10px; text-align: center;">实际完成</th>
      <th style="border: 1px solid #ccc; padding: 10px; text-align: center;">完成率</th>
      <th style="border: 1px solid #ccc; padding: 10px; text-align: center;">状态</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">1</td>
      <td style="border: 1px solid #ccc; padding: 8px;">新增担保业务规模</td>
      <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">亿元</td>
      <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${institution.targetScale.toFixed(2)}</td>
      <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${institution.actualScale.toFixed(2)}</td>
      <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${(institution.scaleCompletionRate * 100).toFixed(1)}%</td>
      <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">{达标/未达标}</td>
    </tr>
    <!-- 其余 7 项指标以此类推，继续生成表格行 -->
  </tbody>
</table>

从{简称}1-12 月主要合作政策目标完成进度分析，{详细描述各项指标完成情况，包括达标情况和未达标原因分析}。主要原因为{深入分析宏观经济、行业环境、公司经营策略等因素}。

**三、授信使用及业务开展**
本年度我司授予{简称}再担保业务授信额度 XX 亿元，其中银担非分险业务授信 XX 亿元。截至 12 月 31 日，{简称}使用再担保业务总授信额度 XX 亿元，使用银担非分险业务授信额度 XX 亿元，授信使用率分别为 XX% 和 XX%。
截至 12 月 31 日，{简称}累计申请代偿补偿项目 XX 笔，获得补偿资金 XX 万元，累计回收金额 XX 万元，补偿款返还率 XX%。
目前，{简称}备案业务主要分为传统业务和总对总批量担保业务两大类，具体业务分类、规模及占比如下表所示：

**四、结论**
{简称}本次评价期内{总体评价}，主要受{主要影响因素}影响，{具体描述}。{代偿率/风险管控}情况{评价}。建议评定为 "{建议类别}"，并{后续建议}。

**重要要求**：
1. **整体效果**：生成的 HTML 报告必须看起来像 Word 文档一样正式、规范，有完整的页面布局
2. **表格格式**：所有表格必须使用 HTML <table> 标签，包含完整的<thead>和<tbody>，绝对不要用字符串字符拼凑表格
3. **文字排版**：文字内容使用 HTML 段落<p>或<div>标签包裹，设置合适的字体（宋体）、字号（14px）、行距（1.8 倍）
4. **页面样式**：使用白色背景、适当的页边距（左右各 40px）、段前段后间距，模拟 Word 的页面效果
5. **语言风格**：使用专业、客观、正式的公文语言，数据准确，分析深入
6. **字数控制**：2000-3000 字`;

    const messages: ChatMessage[] = [
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

        const send = (type: string, data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
        };

        send('status', { text: `正在调用模型生成${institution.shortName}评价报告...` });

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data:')) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;

              try {
                const parsed = JSON.parse(payload) as {
                  choices?: Array<{
                    delta?: {
                      content?: string | Array<{ type?: string; text?: string }>;
                    };
                  }>;
                };

                const delta = parsed.choices?.[0]?.delta?.content;
                let text = '';
                if (typeof delta === 'string') {
                  text = delta;
                } else if (Array.isArray(delta)) {
                  text = delta.map((item) => (item?.text ?? '')).join('');
                }

                if (!text) continue;
                accumulated += text;
                send('chunk', { text });
              } catch {
                continue;
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
