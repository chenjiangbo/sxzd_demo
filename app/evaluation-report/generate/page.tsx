'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';

type StreamMessage =
  | { type: 'status'; text: string }
  | { type: 'complete'; html: string; institutionId: string; institutionName: string }
  | { type: 'error'; message: string };

function EvaluationReportGenerateContent() {
  const searchParams = useSearchParams();
  const institutionId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState('');
  const [reportHtml, setReportHtml] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!institutionId) {
      setError('缺少机构 ID');
      setLoading(false);
      return;
    }

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
          } else if (data.type === 'complete') {
            setReportHtml(data.html);
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
    // 调用 API 下载 Word 文档
    window.open(`/api/evaluation-report/export-html?id=${institutionId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="border-b border-outline-variant/20 bg-white shadow-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link href="/evaluation-report" className="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Link>
            <h1 className="text-lg font-black text-primary">正在生成评价报告</h1>
            <div className="w-32" />
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
            <p className="text-lg font-bold text-on-surface">{statusText}</p>
            <p className="mt-4 text-sm text-on-surface-variant">请稍候，AI 正在撰写报告...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="border-b border-outline-variant/20 bg-white shadow-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link href="/evaluation-report" className="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Link>
            <h1 className="text-lg font-black text-primary">评价报告</h1>
            <div className="w-32" />
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <span className="text-3xl font-black text-red-600">!</span>
            </div>
            <p className="text-lg font-bold text-on-surface">生成失败</p>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <Link
              href={`/evaluation-report?generate=1&id=${institutionId}`}
              className="mt-6 inline-flex items-center rounded-xl bg-primary px-6 py-3 text-sm font-black text-white hover:bg-primary/90"
            >
              重新生成
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-outline-variant/20 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/evaluation-report" className="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </Link>
          <h1 className="text-lg font-black text-primary">{institutionName}评价报告</h1>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-2 text-xs font-black text-primary hover:bg-primary hover:text-white"
          >
            <Download className="h-4 w-4" />
            下载 Word
          </button>
        </div>
      </header>

      <main className="px-0 py-0">
        <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
      </main>
    </div>
  );
}

export default function EvaluationReportGeneratePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <EvaluationReportGenerateContent />
    </Suspense>
  );
}
