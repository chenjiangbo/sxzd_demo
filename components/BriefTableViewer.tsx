'use client';

import { ChevronRight, Table } from 'lucide-react';

interface TableData {
  id: string;
  name: string;
  category: string;
  data: Record<string, any>[];
}

interface BriefTableViewerProps {
  tables: TableData[];
  selectedTableId: string | null;
  onSelectTable: (tableId: string | null) => void;
}

export default function BriefTableViewer({ tables, selectedTableId, onSelectTable }: BriefTableViewerProps) {
  // 按类别分组表格
  const groupedTables = tables.reduce((acc, table) => {
    if (!acc[table.category]) {
      acc[table.category] = [];
    }
    acc[table.category].push(table);
    return acc;
  }, {} as Record<string, TableData[]>);

  return (
    <div className="space-y-6">
      {/* 左侧菜单式表格列表 */}
      <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Table className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-primary">数据表格列表</h2>
          <span className="ml-auto text-xs font-medium text-on-surface-variant">共 {tables.length} 张表格</span>
        </div>

        <div className="space-y-4">
          {Object.entries(groupedTables).map(([category, categoryTables]) => (
            <div key={category}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">{category}</h3>
              <div className="space-y-1">
                {categoryTables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => onSelectTable(selectedTableId === table.id ? null : table.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-all ${
                      selectedTableId === table.id
                        ? 'bg-primary/10 font-bold text-primary'
                        : 'hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          selectedTableId === table.id ? 'rotate-90' : ''
                        }`}
                      />
                      <span>{table.name}</span>
                    </div>
                    <span className="text-xs text-on-surface-variant">
                      {table.data.length} 行数据
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 右侧表格详情 */}
      {selectedTableId && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          {(() => {
            const table = tables.find((t) => t.id === selectedTableId);
            if (!table) return null;

            return (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-primary">{table.name}</h3>
                  <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
                    {table.category}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-primary bg-primary/5">
                        {Object.keys(table.data[0]).map((key) => (
                          <th
                            key={key}
                            className="border-b border-slate-200 px-4 py-3 text-left font-bold text-primary"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.data.map((row, index) => (
                        <tr
                          key={index}
                          className={`transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                          } hover:bg-primary/5`}
                        >
                          {Object.values(row).map((value, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="border-b border-slate-100 px-4 py-3 text-on-surface"
                            >
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 rounded-lg bg-surface-container-low p-4">
                  <p className="text-xs text-on-surface-variant">
                    💡 此表格数据将自动填充到 Word 模板的对应占位符位置
                  </p>
                </div>
              </div>
            );
          })()}
        </section>
      )}
    </div>
  );
}
