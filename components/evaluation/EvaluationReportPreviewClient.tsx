'use client';

import { useEffect, useState } from 'react';

type ReportData = {
  report: {
    title: string;
    reportNo: string;
    createdAt: string;
    sections: Array<{
      title: string;
      body: string[];
    }>;
    adoptedCriteria: string[];
  };
};

export default function EvaluationReportPreviewClient() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData['report'] | null>(null);

  useEffect(() => {
    fetch('/api/evaluation-report/get-data')
      .then((res) => res.json())
      .then((data: ReportData) => {
        setReport(data.report);
        setLoading(false);
      })
      .catch((error) => {
        console.error('获取评价报告失败:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-bold text-on-surface-variant">正在生成评价报告...</p>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">
      <div className="mb-8 border-b border-outline-variant/20 pb-4">
        <h1 className="text-2xl font-black text-primary">{report.title}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">{report.reportNo} · {report.createdAt}</p>
      </div>

      <div className="space-y-6">
        {report.sections.map((section: any, index: number) => (
          <section key={index}>
            <h2 className="mb-3 text-lg font-bold text-primary">{section.title}</h2>
            <div className="space-y-2">
              {section.body.map((paragraph: string, idx: number) => (
                <p key={idx} className="indent-8 text-sm leading-7 text-on-surface">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-8 rounded-2xl bg-surface-container-low p-6">
          <h3 className="mb-3 text-sm font-bold text-on-surface-variant">评价标准</h3>
          <ul className="space-y-1 text-sm text-on-surface">
            {report.adoptedCriteria.map((criteria: string, idx: number) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                {criteria}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
