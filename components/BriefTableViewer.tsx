'use client';

import { useState } from 'react';

type TableData = {
  name: string;
  caption: string;
  headers: string[];
  rows: string[][];
};

type Props = {
  tables: TableData[];
};

export default function BriefTableViewer({ tables }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  // 如果没有表格数据，显示提示
  if (!tables || !Array.isArray(tables) || tables.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-bold text-on-surface-variant">暂无表格数据</p>
        <p className="mt-2 text-sm text-on-surface-variant">请检查 CSV 文件是否存在或格式正确</p>
      </div>
    );
  }

  const currentTable = tables[activeTab];
  if (!currentTable) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-bold text-on-surface-variant">无当前表格数据</p>
      </div>
    );
  }

  return (
    <div>
      {/* Tab 导航 */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {tables.map((table, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-black transition ${
              activeTab === index
                ? 'bg-primary text-white'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            表{index + 1}
          </button>
        ))}
      </div>

      {/* 表格内容 */}
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-headline text-xl font-black text-primary">{currentTable.caption || ''}</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-[11px] text-on-surface">
            <thead>
              <tr className="border-b border-outline-variant/15 text-left text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
                {(currentTable.headers || []).map((header, idx) => (
                  <th key={idx} className="px-4 py-3 whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(currentTable.rows || []).map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-surface-container-low/40'}
                >
                  {(row || []).map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-4 py-3 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 表格说明 */}
        <div className="mt-4 rounded-xl bg-surface-container-low p-4">
          <p className="text-[10px] font-medium text-on-surface-variant">
            <span className="font-bold">备注：</span>
            数据来源：业务系统 | 统计截止日期为报告期末最后一个工作日
          </p>
        </div>
      </section>
    </div>
  );
}
