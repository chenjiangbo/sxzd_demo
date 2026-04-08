'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, FileText } from 'lucide-react';

type StreamMessage =
  | { type: 'status'; text: string }
  | { type: 'complete'; html: string; institutionId: string; institutionName: string; indicators?: Record<string, any> }
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
            setIndicators(data.indicators || null);
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

      <main className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* 左侧：报告预览 */}
          <section className="col-span-12 xl:col-span-8">
            <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
              <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
            </div>
          </section>

          {/* 右侧：口径摘要和指标 */}
          <aside className="col-span-12 space-y-6 xl:col-span-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-low text-secondary">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">本次采用口径摘要</p>
                <p className="text-sm font-black text-primary">写入报告的关键依据</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-surface-container-low px-4 py-4 text-sm font-semibold leading-6 text-on-surface">
                本年度机构评价以政策目标完成度为核心，结合 8 项核心指标进行综合评价。
              </div>
              <div className="rounded-2xl bg-surface-container-low px-4 py-4 text-sm font-semibold leading-6 text-on-surface">
                评价指标包含新增担保业务规模、小微三农占比、再担保规模、分险业务占比、担保放大倍数、代偿率控制、代偿返还率等。
              </div>
              <div className="rounded-2xl bg-surface-container-low px-4 py-4 text-sm font-semibold leading-6 text-on-surface">
                评价结果分为优秀、良好、合格、不合格四个等次，作为授信额度配置的重要依据。
              </div>
            </div>
          </div>

          {indicators && (
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">机构核心指标</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                  <p className="text-[11px] font-black text-on-surface-variant">综合评价结果</p>
                  <p className="mt-1 text-sm font-bold text-primary">{indicators.overallStatus}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                  <p className="text-[11px] font-black text-on-surface-variant">新增担保业务规模完成率</p>
                  <p className="mt-1 text-sm font-bold text-primary">{(indicators.scaleCompletionRate * 100).toFixed(1)}%</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                  <p className="text-[11px] font-black text-on-surface-variant">小微三农占比完成率</p>
                  <p className="mt-1 text-sm font-bold text-primary">{(indicators.customerRatioCompletionRate * 100).toFixed(1)}%</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                  <p className="text-[11px] font-black text-on-surface-variant">代偿率状态</p>
                  <p className="mt-1 text-sm font-bold text-primary">{indicators.compensationRateStatus}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">相关附件</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface">
                输入 1：{institutionName}年度业务数据统计表
              </div>
              <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface">
                输入 2：陕西省政府性融资担保机构综合评价办法
              </div>
              <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface">
                输入 3：保后评价报告模板
              </div>
            </div>
          </div>
        </aside>
        </div>
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
