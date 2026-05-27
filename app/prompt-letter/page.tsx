'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, FileText, Download, X, LoaderCircle, Sparkles } from 'lucide-react';
import PromptLetterPreviewClient from '@/components/PromptLetterPreviewClient';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

type FileItem = {
  id: string;
  name: string;
  type: 'oneDept' | 'threeDept';
  file?: File; // 从服务端恢复的文件没有 File 对象
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  serverId?: string;
  generateStatus?: 'idle' | 'generating' | 'done' | 'error';
  generateProgress?: number;
  reportId?: string; // 关联到生成的报告
};

type GeneratedReport = {
  id: string;
  fileName: string;
  institutionName: string;
  content: string;
  generatedAt: string;
  sourceFileId: string; // 关联到源文件
};

export default function PromptLetterTaskPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [activeReport, setActiveReport] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 页面加载时从服务端恢复已上传的文件列表
  useEffect(() => {
    const loadExistingFiles = async () => {
      try {
        const res = await fetch('/api/prompt-letter/upload');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.files) && data.files.length > 0) {
          const restored: FileItem[] = data.files.map((sf: { id: string; name: string; department: string }) => ({
            id: `restored_${sf.id}`,
            name: sf.name,
            type: (sf.department === 'threeDept' ? 'threeDept' : 'oneDept') as 'oneDept' | 'threeDept',
            file: undefined,
            status: 'success' as const,
            progress: 100,
            serverId: sf.id,
          }));
          setFiles(restored);
        }
      } catch {
        // 静默失败
      }
    };
    loadExistingFiles();
  }, []);

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
      (fileInputRef.current as HTMLInputElement).value = '';
    }
  };

  const removeFile = useCallback(async (fileId: string) => {
    // 先获取 serverId（在从 state 中移除之前）
    const fileObj = files.find(f => f.id === fileId);
    
    // 从前端移除
    setFiles(prev => prev.filter(f => f.id !== fileId));
    
    // 同时删除关联的报告
    if (fileObj?.reportId) {
      setGeneratedReports(prev => prev.filter(r => r.id !== fileObj.reportId));
    }
    
    // 如果有 serverId，调用 DELETE API 删除服务端文件
    if (fileObj?.serverId) {
      try {
        await fetch(`/api/prompt-letter/upload?id=${encodeURIComponent(fileObj.serverId)}`, {
          method: 'DELETE',
        });
      } catch {
        // 静默失败，前端已经移除
      }
    }
  }, [files]);

  const uploadFile = async (fileId: string) => {
    const fileObj = files.find(f => f.id === fileId);
    if (!fileObj || !fileObj.file) return;

    setFiles(prev =>
      prev.map(f =>
        f.id === fileId
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      )
    );

    try {
      const formData = new FormData();
      formData.append('files', fileObj.file!);
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

    // 只对 Word 文件设置生成状态（Excel 不需要显示生成进度）
    setFiles(prev => prev.map(f => {
      const isDocx = f.name.toLowerCase().endsWith('.docx') || f.name.toLowerCase().endsWith('.doc');
      return f.status === 'success' && isDocx
        ? { ...f, generateStatus: 'generating' as const, generateProgress: 0 }
        : f;
    }));

    // 预建 serverId -> 本地文件信息的映射（避免闭包中引用过时的 files 状态）
    const serverToFileMap: Record<string, { localId: string; name: string }> = {};
    files.forEach(f => {
      if (f.serverId) {
        serverToFileMap[f.serverId] = { localId: f.id, name: f.name };
      }
    });

    // 用于跟踪每个文件的累积内容（按 fileId）
    const contentMap: Record<string, string> = {};
    const reportMap: Record<string, string> = {}; // fileId -> reportId

    try {
      const response = await fetch('/api/prompt-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: files.filter(f => f.status === 'success' && f.serverId).map(f => f.serverId),
        }),
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventStr of events) {
          if (!eventStr.trim()) continue;

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

          const fileId = (data.fileId as string) || '';

          switch (eventType) {
            case 'status':
              setStatusMessage(data.text as string);
              if (fileId) {
                // 更新特定文件的生成进度
                setFiles(prev => prev.map(f => {
                  return f.serverId === fileId && f.generateStatus === 'generating'
                    ? { ...f, generateProgress: Math.min((f.generateProgress || 0) + 3, 90) }
                    : f;
                }));
              }
              break;

            case 'chunk': {
              const chunkFileId = data.fileId as string;
              if (!chunkFileId) break;

              const accText = (data.accumulatedText as string) || '';
              contentMap[chunkFileId] = accText;

              // 为该 fileId 创建或更新 reportId
              if (!reportMap[chunkFileId]) {
                reportMap[chunkFileId] = `report_${chunkFileId}_${Date.now()}`;
              }
              const rId = reportMap[chunkFileId];

              // 查找对应的本地文件
              const localFileInfo = serverToFileMap[chunkFileId];
              const fileLabel = localFileInfo?.name || '提示函';

              // 更新或添加报告
              setGeneratedReports(prev => {
                const existing = prev.find(r => r.id === rId);
                if (existing) {
                  return prev.map(r => r.id === rId ? { ...r, content: accText } : r);
                }
                return [...prev, {
                  id: rId,
                  fileName: fileLabel.replace(/\.(docx|doc)$/i, '') + '-提示函',
                  institutionName: '生成中...',
                  content: accText,
                  generatedAt: new Date().toISOString(),
                  sourceFileId: localFileInfo?.localId || '',
                }];
              });

              // 自动选中当前正在生成的报告（根据当前报告数量推算索引）
              setGeneratedReports(prev => {
                const idx = prev.findIndex(r => r.id === rId);
                if (idx >= 0) setActiveReport(idx);
                return prev;
              });

              // 更新特定文件的生成进度
              const chunkProgress = ((data.paragraphIndex as number) || 0) / ((data.totalParagraphs as number) || 1) * 100;
              setFiles(prev => prev.map(f => {
                return f.serverId === chunkFileId && f.generateStatus === 'generating'
                  ? { ...f, generateProgress: Math.max(f.generateProgress || 0, Math.min(chunkProgress, 95)) }
                  : f;
              }));
              break;
            }

            case 'complete': {
              const completeFileId = data.fileId as string;
              if (!completeFileId) break;

              const completeRId = reportMap[completeFileId];
              if (!completeRId) break;

              const completeContent = contentMap[completeFileId] || '';
              const completeLocalInfo = serverToFileMap[completeFileId];

              // 更新报告为最终状态
              setGeneratedReports(prev => {
                return prev.map(r => r.id === completeRId ? {
                  ...r,
                  fileName: (data.fileName as string) || r.fileName,
                  institutionName: (data.institutionName as string) || '未知机构',
                  content: completeContent,
                  generatedAt: (data.generatedAt as string) || new Date().toISOString(),
                } : r);
              });

              // 标记对应文件为完成
              setFiles(prev => prev.map(f => {
                return f.serverId === completeFileId && f.generateStatus === 'generating'
                  ? { ...f, generateStatus: 'done' as const, generateProgress: 100, reportId: completeRId }
                  : f;
              }));

              // 自动选中该报告
              setGeneratedReports(prev => {
                const idx = prev.findIndex(r => r.id === completeRId);
                if (idx >= 0) setActiveReport(idx);
                return prev;
              });
              break;
            }

            case 'error': {
              const errFileId = data.fileId as string;
              if (errFileId) {
                // 特定文件错误
                setFiles(prev => prev.map(f => {
                  return f.serverId === errFileId && f.generateStatus === 'generating'
                    ? { ...f, generateStatus: 'error' as const, generateProgress: 0 }
                    : f;
                }));
              } else {
                // 全局错误
                setFiles(prev => prev.map(f => {
                  const isDoc = f.name.toLowerCase().endsWith('.docx') || f.name.toLowerCase().endsWith('.doc');
                  return f.generateStatus === 'generating' && isDoc
                    ? { ...f, generateStatus: 'error' as const, generateProgress: 0 }
                    : f;
                }));
                throw new Error((data.message as string) || '生成过程中出现错误');
              }
              break;
            }

            case 'all-done':
              setStatusMessage('');
              setIsGenerating(false);
              // 安全网：将所有仍处于 generating 的文件标记为 done
              setFiles(prev => prev.map(f =>
                f.generateStatus === 'generating'
                  ? { ...f, generateStatus: 'done' as const, generateProgress: 100 }
                  : f
              ));
              break;
          }
        }
      }
    } catch (error) {
      console.error('生成报告时出错:', error);
      alert('生成报告失败: ' + (error as Error).message);
      setStatusMessage('');
      // 全局错误：所有 Word 文件标记为错误
      setFiles(prev => prev.map(f => {
        const isDoc = f.name.toLowerCase().endsWith('.docx') || f.name.toLowerCase().endsWith('.doc');
        return f.generateStatus === 'generating' && isDoc
          ? { ...f, generateStatus: 'error' as const, generateProgress: 0 }
          : f;
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  // 点击文件选择对应的报告
  const handleFileClick = (file: FileItem) => {
    if (file.generateStatus === 'done' && file.reportId) {
      const reportIndex = generatedReports.findIndex(r => r.id === file.reportId);
      if (reportIndex >= 0) {
        setActiveReport(reportIndex);
      }
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
                    {files.map(file => {
                      const isActive = file.reportId && generatedReports[activeReport ?? -1]?.id === file.reportId;
                      const canClick = file.generateStatus === 'done';
                      
                      return (
                        <li
                          key={file.id}
                          onClick={() => canClick && handleFileClick(file)}
                          className={`rounded-2xl border p-3 transition-all ${
                            file.type === 'oneDept' ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'
                          } ${canClick ? 'cursor-pointer hover:shadow-md' : ''} ${isActive ? 'ring-2 ring-primary' : ''}`}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(file.id);
                              }}
                              className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          {/* 上传进度 */}
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
                            </div>
                          )}

                          {/* 生成进度 */}
                          {file.generateStatus && file.generateStatus !== 'idle' && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs">
                                <span className={
                                  file.generateStatus === 'generating' ? 'text-orange-600' :
                                  file.generateStatus === 'done' ? 'text-green-600' :
                                  file.generateStatus === 'error' ? 'text-red-600' : 'text-gray-500'
                                }>
                                  {file.generateStatus === 'generating' ? '生成中...' :
                                   file.generateStatus === 'done' ? '生成完成' :
                                   file.generateStatus === 'error' ? '生成失败' : ''}
                                </span>
                                <span>{file.generateProgress ?? 0}%</span>
                              </div>
                              <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-container">
                                <div
                                  className={`h-full transition-all ${
                                    file.generateStatus === 'error' ? 'bg-red-500' :
                                    file.generateStatus === 'done' ? 'bg-green-500' : 'bg-orange-500'
                                  }`}
                                  style={{ width: `${file.generateProgress ?? 0}%` }}
                                />
                              </div>
                              {file.generateStatus === 'generating' && (
                                <div className="mt-1 flex items-center justify-center">
                                  <LoaderCircle className="h-3 w-3 animate-spin text-orange-500" />
                                  <span className="ml-1 text-xs text-orange-600">AI 生成中...</span>
                                </div>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
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
                  <div className="flex items-center gap-3">
                    <h2 className="font-headline text-lg font-black text-primary">生成的提示函</h2>
                    {generatedReports.length >= 1 && (
                      <select
                        value={activeReport ?? ''}
                        onChange={(e) => setActiveReport(e.target.value ? parseInt(e.target.value) : null)}
                        className="rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-1.5 text-sm"
                      >
                        <option value="">选择报告</option>
                        {generatedReports.map((report, index) => (
                          <option key={report.id} value={index}>
                            {report.fileName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {activeReport !== null && generatedReports[activeReport] && (
                    <button
                      onClick={() => {
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

                {activeReport !== null && generatedReports[activeReport] ? (
                  <div>
                    <div className="mb-2">
                      <p className="text-sm font-medium text-primary">{generatedReports[activeReport].fileName}</p>
                      <p className="text-xs text-on-surface-variant">{generatedReports[activeReport].institutionName}</p>
                    </div>
                    <div className="border border-outline-variant/20 rounded-2xl p-6 min-h-[500px]">
                      <PromptLetterPreviewClient
                        content={generatedReports[activeReport].content}
                        fileName={generatedReports[activeReport].fileName}
                      />
                    </div>
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
                      请先上传一部和三部的资料，然后点击“AI 生成”
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