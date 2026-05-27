'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Download, X, LoaderCircle, Sparkles } from 'lucide-react';
import PromptLetterPreviewClient from '@/components/PromptLetterPreviewClient';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

type FileItem = {
  id: string;
  name: string;
  type: 'oneDept' | 'threeDept';
  file: File;
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  serverId?: string; // 服务端返回的文件 ID
};

type GeneratedReport = {
  id: string;
  fileName: string;
  institutionName: string;
  content: string;
  generatedAt: string;
};

export default function PromptLetterTaskPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [activeReport, setActiveReport] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach(file => {
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 简单根据文件扩展名判断部门类型
      const fileType = file.name.includes('一部') || file.name.includes('综合评价') || file.name.endsWith('.docx') 
        ? 'oneDept' 
        : 'threeDept';
      
      setFiles(prev => [
        ...prev,
        {
          id: fileId,
          name: file.name,
          type: fileType,
          file,
          status: 'idle',
          progress: 0
        }
      ]);
    });

    // 清空input，允许选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFile = async (fileId: string) => {
    const fileObj = files.find(f => f.id === fileId);
    if (!fileObj) return;

    setFiles(prev =>
      prev.map(f =>
        f.id === fileId
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      )
    );

    try {
      const formData = new FormData();
      formData.append('files', fileObj.file);
      formData.append('department', fileObj.type);

      // 模拟上传进度
      const interval = setInterval(() => {
        setFiles(prev => {
          const file = prev.find(f => f.id === fileId);
          if (!file || file.progress >= 90) return prev;

          const newProgress = Math.min(file.progress + 10, 90);
          return prev.map(f =>
            f.id === fileId
              ? { ...f, progress: newProgress }
              : f
          );
        });
      }, 200);

      const response = await fetch('/api/prompt-letter/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);

      const result = await response.json();

      if (response.ok && result.success && result.files?.[0]) {
        setFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'success', progress: 100, serverId: result.files[0].id }
              : f
          )
        );
      } else {
        throw new Error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('上传文件失败:', error);
      setFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { ...f, status: 'error', progress: 0 }
            : f
        )
      );
    }
  };

  const uploadAllFiles = () => {
    files.forEach(file => {
      if (file.status === 'idle') {
        void uploadFile(file.id);
      }
    });
  };

  const generateAllReports = async () => {
    const successFiles = files.filter(f => f.status === 'success');

    if (successFiles.length === 0) {
      alert('请先上传文件');
      return;
    }

    setIsGenerating(true);
    setStatusMessage('正在准备生成...');

    try {
      const response = await fetch('/api/prompt-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // 服务端会自动获取已上传的文件列表
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '生成报告失败');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 按双换行分割 SSE 事件
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventStr of events) {
          if (!eventStr.trim()) continue;

          // 解析 SSE 事件: event: xxx\ndata: {...}
          const eventMatch = eventStr.match(/event:\s*(\S+)/);
          const dataMatch = eventStr.match(/data:\s*(.+)/);

          if (!eventMatch || !dataMatch) continue;

          const eventType = eventMatch[1];
          let data: Record<string, unknown>;

          try {
            data = JSON.parse(dataMatch[1]);
          } catch {
            continue;
          }

          switch (eventType) {
            case 'status':
              setStatusMessage(data.text as string);
              break;

            case 'chunk':
              // 累积内容
              accumulatedContent = (data.accumulatedText as string) || accumulatedContent + (data.text as string);
              // 实时更新当前报告的预览
              setGeneratedReports([{
                id: `report_${Date.now()}`,
                fileName: '提示函生成中...',
                institutionName: '生成中',
                content: accumulatedContent,
                generatedAt: new Date().toISOString(),
              }]);
              setActiveReport(0);
              break;

            case 'complete':
              // 生成完成，更新报告列表
              setGeneratedReports([{
                id: `report_${Date.now()}`,
                fileName: (data.fileName as string) || successFiles[0]?.name || '生成的提示函',
                institutionName: (data.institutionName as string) || '未知机构',
                content: accumulatedContent,
                generatedAt: (data.generatedAt as string) || new Date().toISOString(),
              }]);
              setActiveReport(0);
              setStatusMessage('');
              break;

            case 'error':
              throw new Error((data.message as string) || '生成过程中出现错误');
          }
        }
      }
    } catch (error) {
      console.error('生成报告时出错:', error);
      alert('生成报告失败: ' + (error as Error).message);
      setStatusMessage('');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Sidebar />
      <Header />

      <main className="ml-48 min-h-screen bg-surface px-6 pb-8 pt-20">
        <section className="mb-6 flex items-end justify-between gap-6">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-on-surface-variant">
              <span>业务管理</span>
              <span>/</span>
              <span>综合评价提示函</span>
            </nav>
            <h1 className="font-headline text-[3.1rem] font-black leading-none tracking-tight text-primary">综合评价提示函</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
              根据一部和三部提供的资料，自动生成综合评价提示函
            </p>
          </div>
        </section>

        <div className="grid grid-cols-12 gap-6">
          {/* 区域A - 文件上传和列表 */}
          <div className="col-span-4">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="font-headline text-lg font-black text-primary">文件上传</h2>
                <p className="text-sm text-on-surface-variant">上传一部和三部的资料以生成提示函</p>
              </div>

              <div 
                className="mb-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant/30 bg-surface-container-low p-6 text-center transition hover:border-primary/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 text-primary/60" />
                <p className="mt-2 font-medium text-primary">点击上传文件</p>
                <p className="text-xs text-on-surface-variant">支持 Word 文档和 Excel 表格</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".docx,.xlsx,.xls"
                />
              </div>

              <div className="mb-4 flex gap-3">
                <button
                  onClick={uploadAllFiles}
                  disabled={files.every(f => f.status !== 'idle') || isGenerating}
                  className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  上传全部
                </button>
                <button
                  onClick={generateAllReports}
                  disabled={files.filter(f => f.status === 'success').length === 0 || isGenerating}
                  className="flex-1 rounded-2xl bg-secondary px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      生成中...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI 生成
                    </span>
                  )}
                </button>
              </div>

              {/* 状态消息 */}
              {statusMessage && (
                <div className="mb-4 rounded-xl bg-surface-container p-3">
                  <div className="flex items-center gap-2">
                    <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                    <p className="text-sm text-primary">{statusMessage}</p>
                  </div>
                </div>
              )}

              <div className="max-h-96 overflow-y-auto pr-2">
                <h3 className="mb-3 text-sm font-bold text-on-surface-variant">文件列表</h3>
                {files.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">暂无上传文件</p>
                ) : (
                  <ul className="space-y-2">
                    {files.map(file => (
                      <li 
                        key={file.id} 
                        className={`rounded-2xl border p-3 ${file.type === 'oneDept' ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-primary">{file.name}</p>
                              <p className="text-xs text-on-surface-variant">
                                {file.type === 'oneDept' ? '一部资料' : '三部资料'}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFile(file.id)}
                            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {file.status !== 'idle' && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-on-surface-variant">
                              <span>
                                {file.status === 'uploading' ? '上传中...' : 
                                 file.status === 'success' ? '上传成功' : '错误'}
                              </span>
                              <span>{file.progress}%</span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-container">
                              <div 
                                className={`h-full ${file.status === 'error' ? 'bg-error' : 'bg-primary'}`}
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                            
                            {file.status === 'uploading' && (
                              <div className="mt-2 flex items-center justify-center">
                                <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                                <span className="ml-2 text-xs text-on-surface-variant">处理中...</span>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* 右侧主界面 - 预览区域 */}
          <div className="col-span-8">
            {generatedReports.length > 0 ? (
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-headline text-lg font-black text-primary">生成的提示函</h2>
                  <div className="flex gap-2">
                    <select 
                      value={activeReport ?? ''}
                      onChange={(e) => setActiveReport(e.target.value ? parseInt(e.target.value) : null)}
                      className="rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2 text-sm"
                    >
                      <option value="">选择报告</option>
                      {generatedReports.map((report, index) => (
                        <option key={report.id} value={index}>
                          {report.fileName}
                        </option>
                      ))}
                    </select>
                    {activeReport !== null && (
                      <button 
                        onClick={() => {
                          // 创建下载链接
                          const url = `/api/prompt-letter/export?fileName=${encodeURIComponent(generatedReports[activeReport!].fileName)}`;
                          window.open(url, '_blank');
                        }}
                        className="flex items-center gap-2 rounded-2xl border border-outline-variant/30 bg-white px-4 py-2 text-sm font-black text-primary"
                      >
                        <Download className="h-4 w-4" />
                        导出
                      </button>
                    )}
                  </div>
                </div>

                {activeReport !== null && generatedReports[activeReport] ? (
                  <div className="border border-outline-variant/20 rounded-2xl p-6 min-h-[500px]">
                    <PromptLetterPreviewClient 
                      content={generatedReports[activeReport].content} 
                      fileName={generatedReports[activeReport].fileName}
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[500px] items-center justify-center rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low">
                    <p className="text-gray-500">请选择要预览的提示函</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex min-h-[600px] items-center justify-center rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto text-primary/30" />
                    <h3 className="mt-4 text-lg font-bold text-primary">暂无生成的提示函</h3>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      请先上传一部和三部的资料，然后点击"生成全部"
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}