import { NextRequest, NextResponse } from 'next/server';
import { blackwhiteChat } from '@/lib/server/blackwhite';
import { getCreditAssistantContext } from '@/lib/server/credit-report';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const question = typeof body.question === 'string' ? body.question.trim() : '';

    if (!question) {
      return NextResponse.json({ error: '问题不能为空。' }, { status: 400 });
    }

    const context = await getCreditAssistantContext();
    const answer = await blackwhiteChat(
      [
        {
          role: 'system',
          content: [
            '你是授信制度助手，负责回答用户关于制度条文、统计表字段、授信配置逻辑、授信审批流程的问题。',
            '你只能基于提供的制度文本、统计表数据、样稿报告和结构化统计结果作答。',
            '如果提供的材料里没有依据，必须明确回答“现有制度文本和统计表里没有足够依据支持这个结论”，不能编造。',
            '回答要简洁、专业、业务化，优先给结论，再给依据；如涉及统计表，请点出关键字段或机构数据。',
            '不要输出 markdown 标题，不要输出 JSON。',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            `当前问题：${question}`,
            '',
            '以下是可用材料：',
            JSON.stringify(
              {
                year: context.year,
                stats: context.stats,
                groups: context.groups,
                institutions: context.institutions,
                policyTopics: context.policyTopics,
                policyText: context.policyText,
                reportSample: context.reportText,
              },
              null,
              2,
            ),
          ].join('\n'),
        },
      ],
      {
        temperature: 0.1,
        timeoutMs: 180_000,
      },
    );

    return NextResponse.json({ answer });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || '制度助手回答失败。' },
      { status: 500 },
    );
  }
}
