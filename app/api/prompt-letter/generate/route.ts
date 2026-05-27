import { NextResponse } from 'next/server';
import {
  listUploadedFiles,
  extractFileContent,
  generatePromptLetterWithAI,
  saveGeneratedPromptLetter,
  type ExtractedData,
} from '@/lib/server/prompt-letter';

function createSseMessage(event: string, data: Record<string, unknown>) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(createSseMessage(event, data)));
      };

      try {
        // Step 1: 获取上传的文件列表
        send('status', { text: '正在读取上传的文件列表...' });
        const files = await listUploadedFiles();

        if (files.length === 0) {
          send('error', { message: '未找到上传的文件，请先上传文件' });
          controller.close();
          return;
        }

        send('status', { text: `找到 ${files.length} 个文件，正在提取内容...` });

        // Step 2: 提取文件内容
        const extractedDataList: ExtractedData[] = [];
        for (let i = 0; i < files.length; i++) {
          const fileInfo = files[i];
          send('status', { text: `正在提取: ${fileInfo.name} (${i + 1}/${files.length})` });
          try {
            const extracted = await extractFileContent(fileInfo);
            extractedDataList.push(extracted);
            console.log(`[生成路由] 提取完成: ${fileInfo.name}, ${extracted.rawText.length} 字符`);
          } catch (err) {
            console.error(`[生成路由] 提取失败: ${fileInfo.name}`, err);
            send('status', { text: `警告: 文件 ${fileInfo.name} 提取失败，跳过` });
          }
        }

        if (extractedDataList.length === 0) {
          send('error', { message: '所有文件提取失败，无法生成提示函' });
          controller.close();
          return;
        }

        send('status', { text: `成功提取 ${extractedDataList.length} 个文件的内容` });

        // Step 3: 加载 Skill 规则并调用 AI
        send('status', { text: '正在加载 Skill 规则文件...' });
        send('status', { text: '正在调用 AI 模型生成提示函（这可能需要 1-3 分钟）...' });

        // 心跳定时器：每 10 秒发送一次保持连接活跃
        let heartbeatCounter = 0;
        const heartbeatInterval = setInterval(() => {
          heartbeatCounter++;
          send('status', { text: `AI 正在生成中... (${heartbeatCounter * 10}s)` });
        }, 10000);

        let letter;
        try {
          letter = await generatePromptLetterWithAI(extractedDataList);
        } finally {
          clearInterval(heartbeatInterval);
        }

        // Step 4: 保存生成的结果
        send('status', { text: 'AI 生成完成，正在保存结果...' });
        const filePath = await saveGeneratedPromptLetter(letter);
        console.log(`[生成路由] 已保存: ${filePath}`);

        // Step 5: 分块发送生成的内容
        send('status', { text: '正在逐段输出提示函预览...' });

        const paragraphs = letter.rawText.split(/\n\n+/);
        let accumulatedText = '';

        for (let i = 0; i < paragraphs.length; i++) {
          const paragraph = paragraphs[i];
          if (paragraph.trim()) {
            accumulatedText += (accumulatedText ? '\n\n' : '') + paragraph;
            send('chunk', {
              text: paragraph,
              accumulatedText,
              paragraphIndex: i,
              totalParagraphs: paragraphs.length,
            });
            await new Promise((resolve) => setTimeout(resolve, 150));
          }
        }

        // Step 6: 发送完成信号
        send('complete', {
          text: '生成完成',
          institutionName: letter.institutionName,
          fileName: letter.fileName,
          generatedAt: letter.generatedAt,
          cached: false,
        });

        console.log(`[生成路由] 生成完成: ${letter.institutionName}`);
      } catch (err) {
        console.error('[生成路由] 生成提示函时出错:', err);
        send('error', {
          message: err instanceof Error ? err.message : '生成过程中出现未知错误',
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
