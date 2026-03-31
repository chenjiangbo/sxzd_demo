'use client';

import { Calendar, Download, FileText, RefreshCw, Table2 } from 'lucide-react';
import { useState } from 'react';
import BriefTableViewer from './BriefTableViewer';

interface TableData {
  id: string;
  name: string;
  category: string;
  data: Record<string, any>[];
}

export default function BriefGenerator() {
  const [selectedPeriod, setSelectedPeriod] = useState<'first-half' | 'second-half' | 'custom'>('first-half');
  const [customYear, setCustomYear] = useState('2026');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFile, setGeneratedFile] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tablesData, setTablesData] = useState<TableData[]>([]);

  // 模拟加载数据
  const loadTablesData = async () => {
    try {
      const response = await fetch('/data/brief-tables.json');
      const data = await response.json();
      setTablesData(data.tables);
    } catch (error) {
      console.error('加载表格数据失败:', error);
    }
  };

  // 生成简报
  const handleGenerateBrief = async () => {
    setIsGenerating(true);
    try {
      // 调用后端 API 生成简报
      const periodText = selectedPeriod === 'first-half' ? '上半年' : '下半年';
      const response = await fetch('/api/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: selectedPeriod,
          periodText: `${customYear}年${periodText}`,
          year: customYear,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setGeneratedFile(url);
      } else {
        throw new Error('生成失败');
      }
    } catch (error) {
      console.error('生成简报失败:', error);
      alert('生成简报失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 下载简报
  const handleDownload = () => {
    if (generatedFile) {
      const a = document.createElement('a');
      a.href = generatedFile;
      a.download = `业务一部担保业务简报-${customYear}年${selectedPeriod === 'first-half' ? '上半年' : '下半年'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(generatedFile);
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部控制区 */}
      <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-primary">担保业务简报生成</h1>
            <p className="mt-1 text-sm text-on-surface-variant">选择报告期间，自动生成业务一部担保业务简报</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <FileText className="h-4 w-4" />
              12 张数据表格
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
              <Table2 className="h-4 w-4" />
              Word 模板填充
            </span>
          </div>
        </div>

        {/* 时间选择和控制按钮 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-400" />
            <span className="text-sm font-semibold text-on-surface">报告期间：</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPeriod('first-half')}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  selectedPeriod === 'first-half'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                上半年
              </button>
              <button
                onClick={() => setSelectedPeriod('second-half')}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  selectedPeriod === 'second-half'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                下半年
              </button>
              <button
                onClick={() => setSelectedPeriod('custom')}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  selectedPeriod === 'custom'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                自定义
              </button>
            </div>
          </div>

          {selectedPeriod === 'custom' && (
            <select
              value={customYear}
              onChange={(e) => setCustomYear(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-on-surface focus:border-primary focus:outline-none"
            >
              <option value="2026">2026 年</option>
              <option value="2025">2025 年</option>
              <option value="2024">2024 年</option>
            </select>
          )}

          <div className="ml-auto flex gap-3">
            <button
              onClick={loadTablesData}
              disabled={isGenerating}
              className="flex items-center gap-2 rounded-lg bg-surface-container px-4 py-2 text-sm font-bold text-on-surface transition-all hover:bg-surface-container-high disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              加载数据
            </button>
            <button
              onClick={handleGenerateBrief}
              disabled={isGenerating || tablesData.length === 0}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  生成简报
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 表格查看器 */}
      {tablesData.length > 0 && (
        <BriefTableViewer
          tables={tablesData}
          selectedTableId={selectedTable}
          onSelectTable={setSelectedTable}
        />
      )}

      {/* 生成结果提示 */}
      {generatedFile && (
        <section className="rounded-xl bg-success-container p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-fixed">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-success-container">简报生成成功！</h3>
                <p className="text-sm text-on-success-container">
                  {customYear}年{selectedPeriod === 'first-half' ? '上半年' : '下半年'}担保业务简报已准备就绪
                </p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-success shadow-sm transition-all hover:shadow-md"
            >
              <Download className="h-5 w-5" />
              下载 Word 文档
            </button>
          </div>
        </section>
      )}

      {/* 使用说明 */}
      <section className="rounded-xl border border-dashed border-slate-200 bg-surface-container-lowest p-6">
        <h3 className="mb-3 text-sm font-bold text-primary">📋 使用说明</h3>
        <ol className="list-inside list-decimal space-y-2 text-sm text-on-surface-variant">
          <li>点击上方时间选择按钮，选择报告期间（上半年/下半年/自定义）</li>
          <li>点击"加载数据"按钮，从本地 JSON 文件读取 12 张业务表格</li>
          <li>点击表格名称可以查看该表的详细数据</li>
          <li>点击"生成简报"按钮，系统自动填充 Word 模板并生成文档</li>
          <li>生成成功后，点击下载按钮获取 Word 文档</li>
        </ol>
      </section>
    </div>
  );
}
