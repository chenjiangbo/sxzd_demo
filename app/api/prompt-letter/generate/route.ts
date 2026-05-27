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

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  // 从请求体中获取客户端指定的文件 ID 列表
  let clientFileIds: string[] = [];
  try {
    const body = await request.json();
    clientFileIds = (body.fileIds as string[]) || [];
  } catch {
    clientFileIds = [];
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(createSseMessage(event, data)));
      };

      try {
        // Step 1: 获取上传的文件列表，只处理客户端指定的文件
        send('status', { text: '正在读取上传的文件列表...', fileId: '' });
        const allFiles = await listUploadedFiles();

        // 如果客户端传了 fileIds，只处理这些文件；否则处理所有文件
        const files = clientFileIds.length > 0
          ? allFiles.filter(f => clientFileIds.includes(f.id))
          : allFiles;

        if (files.length === 0) {
          send('error', { message: '未找到上传的文件，请先上传文件' });
          controller.close();
          return;
        }

        // 分离 Word 文件和 Excel 文件
        const wordFiles = files.filter(f => {
          const ext = f.name.toLowerCase();
          return ext.endsWith('.docx') || ext.endsWith('.doc');
        });
        const excelFiles = files.filter(f => {
          const ext = f.name.toLowerCase();
          return ext.endsWith('.xlsx') || ext.endsWith('.xls');
        });

        if (wordFiles.length === 0) {
          send('error', { message: '未找到 Word 文档，请先上传 .docx 文件' });
          controller.close();
          return;
        }

        send('status', { text: `找到 ${wordFiles.length} 个 Word 文档和 ${excelFiles.length} 个 Excel 文件`, fileId: '' });

        // Step 2: 提取 Excel 数据（作为共享参考数据）
        const excelDataList: ExtractedData[] = [];
        for (const excelFile of excelFiles) {
          try {
            const extracted = await extractFileContent(excelFile);
            excelDataList.push(extracted);
            send('status', { text: `已提取 Excel 数据: ${excelFile.name}`, fileId: '' });
          } catch (err) {
            console.error(`[生成路由] Excel 提取失败: ${excelFile.name}`, err);
          }
        }

        // Step 3: 逐个 Word 文件生成提示函
        for (let fi = 0; fi < wordFiles.length; fi++) {
          const wordFile = wordFiles[fi];
          const fileId = wordFile.id;

          send('status', { text: `正在处理: ${wordFile.name} (${fi + 1}/${wordFiles.length})`, fileId });

          // 提取 Word 文件内容
          let wordData: ExtractedData;
          try {
            wordData = await extractFileContent(wordFile);
            console.log(`[生成路由] Word 提取完成: ${wordFile.name}, ${wordData.rawText.length} 字符`);
          } catch (err) {
            console.error(`[生成路由] Word 提取失败: ${wordFile.name}`, err);
            send('error', { message: `文件 ${wordFile.name} 内容提取失败`, fileId });
            continue;
          }

          // 组合: 当前 Word 文件 + 所有 Excel 数据
          const combinedData: ExtractedData[] = [wordData, ...excelDataList];

          send('status', { text: `正在调用 AI 生成: ${wordFile.name}`, fileId });

          // 心跳定时器
          let heartbeatCounter = 0;
          const heartbeatInterval = setInterval(() => {
            heartbeatCounter++;
            send('status', { text: `AI 正在生成中... (${heartbeatCounter * 10}s)`, fileId });
          }, 10000);

          let letter;
          try {
            letter = await generatePromptLetterWithAI(combinedData);
          } finally {
            clearInterval(heartbeatInterval);
          }

          // 保存结果
          send('status', { text: 'AI 生成完成，正在保存...', fileId });
          const filePath = await saveGeneratedPromptLetter(letter);
          console.log(`[生成路由] 已保存: ${filePath}`);

          // 分块发送内容
          send('status', { text: '正在输出预览...', fileId });
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
                fileId,
              });
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }

          // 发送完成信号（包含 fileId）
          send('complete', {
            text: '生成完成',
            institutionName: letter.institutionName,
            fileName: letter.fileName,
            generatedAt: letter.generatedAt,
            fileId,
          });

          console.log(`[生成路由] 文件 ${wordFile.name} 生成完成: ${letter.institutionName}`);
        }

        // 所有文件生成完毕
        send('all-done', { text: `全部 ${wordFiles.length} 个文件生成完成` });
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
