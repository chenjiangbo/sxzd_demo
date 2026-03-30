'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleSlash, ExternalLink, FileText, Sparkles, X } from 'lucide-react';

type MaterialStatus = '已匹配' | '待确认' | '缺失' | '不适用';

type MaterialFile = {
  name: string;
  url: string;
  relativePath: string;
  previewText: string | null;
};

type MaterialRow = {
  name: string;
  status: MaterialStatus;
  aiReason: string;
  manualAttention: string | null;
  snippet: string;
  files: MaterialFile[];
};

function MaterialStatusIcon({ status }: { status: MaterialStatus }) {
  if (status === '已匹配') {
    return (
      <span title="已匹配" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-tertiary-fixed-dim/20 text-on-tertiary-container">
        <CheckCircle2 className="h-4 w-4" />
      </span>
    );
  }
  if (status === '待确认') {
    return (
      <span title="待确认" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <AlertTriangle className="h-4 w-4" />
      </span>
    );
  }
  if (status === '缺失') {
    return (
      <span title="缺失" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-error-container text-error">
        <CircleSlash className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span title="不适用" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
      <CircleSlash className="h-4 w-4" />
    </span>
  );
}

export default function IntegrityChecklistTable({ items }: { items: MaterialRow[] }) {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialRow | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  const selectedFile = useMemo(() => {
    if (!selectedMaterial) return null;
    return selectedMaterial.files[selectedFileIndex] ?? selectedMaterial.files[0] ?? null;
  }, [selectedFileIndex, selectedMaterial]);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">
            <tr>
              <th className="px-5 py-4">材料名称</th>
              <th className="px-5 py-4">匹配文件</th>
              <th className="px-5 py-4">状态</th>
              <th className="px-5 py-4">说明</th>
              <th className="px-5 py-4 text-right">查看</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.name} className="align-top transition-colors hover:bg-slate-50/70">
                <td className="px-5 py-4 font-bold text-primary">{item.name}</td>
                <td className="px-5 py-4 text-on-surface-variant">
                  {item.files.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {item.files.map((file) => (
                        <button
                          key={file.name}
                          type="button"
                          onClick={() => {
                            setSelectedMaterial(item);
                            setSelectedFileIndex(item.files.findIndex((entry) => entry.name === file.name));
                          }}
                          className="rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-surface-container-high"
                        >
                          {file.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    '未发现匹配文件'
                  )}
                </td>
                <td className="px-5 py-4">
                  <MaterialStatusIcon status={item.status} />
                </td>
                <td className="px-5 py-4 text-on-surface-variant">
                  <details className="group relative inline-block">
                    <summary className="list-none">
                      <span className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-secondary transition-colors hover:bg-slate-200">
                        查看说明
                        <Sparkles className="h-3.5 w-3.5" />
                      </span>
                    </summary>
                    <div className="absolute left-0 top-8 z-20 w-[360px] max-w-[42vw] rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-on-surface shadow-2xl">
                      <p className="font-semibold text-primary">{item.aiReason}</p>
                      <p className="mt-3 rounded-xl bg-slate-50 p-3">{item.snippet}</p>
                      {item.manualAttention ? <p className="mt-3 font-semibold text-secondary">{item.manualAttention}</p> : null}
                    </div>
                  </details>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    disabled={item.files.length === 0}
                    onClick={() => {
                      setSelectedMaterial(item);
                      setSelectedFileIndex(0);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    查看详情
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedMaterial && selectedFile ? (
        <div className="fixed inset-0 z-[150] bg-slate-950/45">
          <div className="flex h-screen w-screen flex-col overflow-hidden bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-secondary">Source Viewer</p>
                <h3 className="mt-0.5 text-lg font-black text-primary">{selectedMaterial.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMaterial(null);
                  setSelectedFileIndex(0);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-primary transition-colors hover:bg-surface-container"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 xl:grid-cols-[340px_minmax(0,1fr)]">
              <aside className="min-h-0 overflow-y-auto border-r border-slate-100 bg-surface-container-low p-5">
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-secondary">AI 识别结论</p>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-primary">{selectedMaterial.aiReason}</p>
                    {selectedMaterial.manualAttention ? (
                      <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800">{selectedMaterial.manualAttention}</p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-secondary" />
                      <p className="text-sm font-black text-primary">原件列表</p>
                    </div>
                    <div className="space-y-2">
                      {selectedMaterial.files.map((file, index) => (
                        <button
                          key={file.name}
                          type="button"
                          onClick={() => setSelectedFileIndex(index)}
                          className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                            index === selectedFileIndex ? 'border-secondary/30 bg-secondary/5' : 'border-slate-100 bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <p className="text-xs font-bold text-primary">{file.name}</p>
                          <p className="mt-1 line-clamp-2 text-[11px] text-on-surface-variant">{file.relativePath}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>

              <section className="flex min-h-0 flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                  <div>
                    <p className="text-sm font-black text-primary">{selectedFile.name}</p>
                    <p className="text-xs text-on-surface-variant">{selectedFile.relativePath}</p>
                  </div>
                  <a
                    href={selectedFile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-secondary transition-colors hover:bg-slate-50"
                  >
                    新窗口打开原件
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="min-h-0 flex-1 overflow-hidden bg-slate-50 p-4">
                  <iframe
                    title={selectedFile.name}
                    src={selectedFile.url}
                    className="h-full w-full rounded-2xl border border-slate-200 bg-white"
                  />
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
