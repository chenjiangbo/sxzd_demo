'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Download, Loader2 } from 'lucide-react';

type StreamMessage =
  | { type: 'status'; text: string }
  | { type: 'chunk'; text: string }
  | { type: 'complete'; text: string; institutionId: string; institutionName: string }
  | { type: 'error'; message: string };

interface EvaluationReportPreviewClientProps {
  institutionId: string;
  selectedGroup: string | null;
  currentPage: string | null;
}

export default function EvaluationReportPreviewClient({ institutionId, selectedGroup, currentPage }: EvaluationReportPreviewClientProps) {
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState('');
  const [reportHtml, setReportHtml] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let accumulated = '';

    fetch('/api/evaluation-report/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institutionId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        const lines = text.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = JSON.parse(line.slice(5)) as StreamMessage;
          
          if (data.type === 'status') {
            setStatusText(data.text);
          } else if (data.type === 'chunk') {
            accumulated += data.text;
            setReportHtml(accumulated);
          } else if (data.type === 'complete') {
            accumulated = data.text;
            setReportHtml(accumulated);
            setInstitutionName(data.institutionName);
            setLoading(false);
          } else if (data.type === 'error') {
            setError(data.message);
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        setError(err.message || '生成失败');
        setLoading(false);
      });
  }, [institutionId]);

  const handleDownload = () => {
    window.open(`/api/evaluation-report/export-html?id=${institutionId}`, '_blank');
  };

  const handleClose = () => {
    // 构建返回 URL，保留 group 和 page 参数
    let url = '/evaluation-report';
    const params = new URLSearchParams();
    if (selectedGroup) params.set('group', selectedGroup);
    if (currentPage) params.set('page', currentPage);
    if (params.toString()) url += `?${params.toString()}`;
    // 使用 window.location.href 直接跳转，确保 URL 变化触发页面重新渲染
    window.location.href = url;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-12 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-lg font-bold text-on-surface">{statusText}</p>
          <p className="mt-4 text-sm text-on-surface-variant">请稍候，AI 正在撰写报告...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-12 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="text-3xl font-black text-red-600">!</span>
          </div>
          <p className="text-lg font-bold text-on-surface">生成失败</p>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={handleClose}
            className="mt-6 inline-flex items-center rounded-xl bg-primary px-6 py-3 text-sm font-black text-white hover:bg-primary/90"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div 
        className="h-[90vh] w-full max-w-5xl bg-white shadow-2xl overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ borderRadius: '0' }}
      >
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant/20 bg-white px-8 py-4 shadow-sm">
          <div>
            <h1 className="text-lg font-black text-primary">{institutionName}评价报告</h1>
            <p className="text-xs text-on-surface-variant">AI 自动生成 · HTML 格式</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-2 text-xs font-black text-primary hover:bg-primary hover:text-white transition-colors"
            >
              <Download className="h-4 w-4" />
              下载 Word
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="rounded-full p-2 hover:bg-surface-container-low transition-colors"
            >
              <X className="h-5 w-5 text-on-surface-variant" />
            </button>
          </div>
        </header>

        {/* Content - A4 Paper Style */}
        <main className="mx-auto max-w-4xl px-6 py-8">
          <div 
            className="rounded-xl bg-white p-8 shadow-sm min-h-[842px]"
            style={{ 
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            }}
          >
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: reportHtml }}
              style={{ 
                fontFamily: "'SimSun', serif",
                fontSize: '14px',
                lineHeight: '1.8',
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
