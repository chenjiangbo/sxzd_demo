import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { 
  Filter, 
  Bolt, 
  Lightbulb, 
  AlertTriangle, 
  ListChecks, 
  History, 
  Info, 
  CornerUpLeft, 
  ChevronRight 
} from 'lucide-react';
import Link from 'next/link';

export default function IntegrityCheck() {
  return (
    <>
      <Sidebar />
      <Header />
      
      <main className="ml-64 mt-16 p-8 pb-32 min-h-screen bg-background font-body">
        {/* Step Indicator */}
        <div className="mb-10 flex items-center justify-center">
          <div className="flex items-center gap-4 w-full max-w-4xl">
            <div className="flex flex-col items-center flex-1">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold mb-2">1</div>
              <span className="text-xs font-bold text-primary">完整性检查</span>
            </div>
            <div className="h-px bg-slate-200 flex-1 -mt-6"></div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant text-xs font-bold mb-2">2</div>
              <span className="text-xs text-on-surface-variant">一致性核验</span>
            </div>
            <div className="h-px bg-slate-200 flex-1 -mt-6"></div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant text-xs font-bold mb-2">3</div>
              <span className="text-xs text-on-surface-variant">合规性扫描</span>
            </div>
            <div className="h-px bg-slate-200 flex-1 -mt-6"></div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant text-xs font-bold mb-2">4</div>
              <span className="text-xs text-on-surface-variant">终审上报</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Side: Check Summary & Table */}
          <div className="col-span-12 xl:col-span-9 space-y-8">
            {/* Summary Header */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 border-primary">
                <p className="text-xs text-on-surface-variant font-medium mb-1">待审材料总数</p>
                <h2 className="text-3xl font-headline font-extrabold text-primary">12</h2>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 border-on-tertiary-container">
                <p className="text-xs text-on-surface-variant font-medium mb-1">已自动匹配要件</p>
                <h2 className="text-3xl font-headline font-extrabold text-on-tertiary-container">8</h2>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 border-secondary">
                <p className="text-xs text-on-surface-variant font-medium mb-1">待人工确认</p>
                <h2 className="text-3xl font-headline font-extrabold text-secondary">2</h2>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 border-error">
                <p className="text-xs text-on-surface-variant font-medium mb-1">关键件缺失</p>
                <h2 className="text-3xl font-headline font-extrabold text-error">1</h2>
              </div>
            </div>

            {/* Main Table Section */}
            <section className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden">
              <div className="px-8 py-5 flex items-center justify-between bg-surface-container-low/30 border-b border-slate-100">
                <h3 className="font-headline font-bold text-lg text-primary">材料要件检查清单</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high transition-colors rounded text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" />
                    全部状态
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">要件名称</th>
                      <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">对应识别材料</th>
                      <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">核验状态</th>
                      <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-semibold text-sm text-primary">正式红头代偿补偿申请函</td>
                      <td className="px-8 py-5 text-sm text-on-surface-variant italic">识别文件：关于XXX代偿补偿申请.pdf</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-full bg-on-tertiary-container/10 text-on-tertiary-container text-[11px] font-bold">已匹配</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-secondary hover:underline text-xs font-bold">查看详情</button>
                      </td>
                    </tr>
                    
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-semibold text-sm text-primary">代偿审批文件</td>
                      <td className="px-8 py-5 text-sm text-on-surface-variant italic">未找到直接对应文件</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[11px] font-bold">待人工确认</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-secondary hover:underline text-xs font-bold">手动关联</button>
                      </td>
                    </tr>
                    
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-semibold text-sm text-primary">借款合同</td>
                      <td className="px-8 py-5 text-sm text-on-surface-variant italic">识别文件：JZL-2023-004.pdf</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-full bg-on-tertiary-container/10 text-on-tertiary-container text-[11px] font-bold">已匹配</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-secondary hover:underline text-xs font-bold">查看详情</button>
                      </td>
                    </tr>
                    
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-semibold text-sm text-primary">保证合同 / 委托担保合同</td>
                      <td className="px-8 py-5 text-sm text-on-surface-variant italic">识别文件：WTDB-2023-08.pdf</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-full bg-on-tertiary-container/10 text-on-tertiary-container text-[11px] font-bold">已匹配</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-secondary hover:underline text-xs font-bold">查看详情</button>
                      </td>
                    </tr>
                    
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-semibold text-sm text-primary">反担保合同</td>
                      <td className="px-8 py-5 text-sm text-on-surface-variant italic">识别文件：FDB-GZ-001.pdf</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-full bg-on-tertiary-container/10 text-on-tertiary-container text-[11px] font-bold">已匹配</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-secondary hover:underline text-xs font-bold">查看详情</button>
                      </td>
                    </tr>
                    
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-semibold text-sm text-primary">反担保物权利凭证</td>
                      <td className="px-8 py-5 text-sm text-on-surface-variant italic">本案采取个人连带责任保证</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-bold">本案可能不适用</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-on-surface-variant opacity-50 text-xs font-bold">无需操作</span>
                      </td>
                    </tr>
                    
                    <tr className="bg-error/5 hover:bg-error/10 transition-colors">
                      <td className="px-8 py-5 font-semibold text-sm text-error">追偿过程法律文书</td>
                      <td className="px-8 py-5 text-sm text-error/80 italic">未在上传包中检测到</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-full bg-error/10 text-error text-[11px] font-bold">缺失</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-error hover:underline text-xs font-bold">补录通知</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Right Side: AI Assistant */}
          <div className="col-span-12 xl:col-span-3">
            <div className="sticky top-24 bg-white/90 backdrop-blur-xl rounded-xl shadow-[-20px_0_40px_rgba(11,28,48,0.06)] h-[calc(100vh-140px)] flex flex-col border border-slate-100">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-[#001b18]">AI 智能助手</span>
                  <Bolt className="w-5 h-5 text-tertiary-fixed-dim fill-tertiary-fixed-dim" />
                </div>
                <p className="text-xs text-slate-500 mb-4">Agent Intelligence</p>
                <button className="w-full py-2.5 bg-on-tertiary-container text-white text-xs font-bold rounded-lg hover:bg-on-tertiary-container/90 transition-colors shadow-sm">
                  开始风险扫描
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* AI Insights */}
                <div className="bg-primary/5 p-4 rounded-xl border-l-4 border-tertiary-fixed-dim">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-on-tertiary-container" />
                    <span className="text-xs font-bold text-primary">智能提示</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    系统检测到本案反担保措施为“个人连带责任保证”，已自动标记“反担保物权利凭证”为不适用项。建议重点核查保证人的征信报告完整性。
                  </p>
                </div>
                
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 bg-error/10 p-1.5 rounded-md">
                      <AlertTriangle className="w-4 h-4 text-error" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary mb-1">风险预警</p>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">代偿审批文件与申请函日期跨度超过60天，请注意合规性风险。</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 bg-on-tertiary-container/10 p-1.5 rounded-md">
                      <ListChecks className="w-4 h-4 text-on-tertiary-container" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary mb-1">合规建议</p>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">建议在后续“一致性核验”环节加强对借款合同编号的比对。</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-b-xl border-t border-slate-100">
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <History className="w-3.5 h-3.5" />
                  <span>最后更新: 2023-11-24 14:20</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Footer Actions */}
      <footer className="fixed bottom-0 right-0 left-64 bg-white/90 backdrop-blur-md border-t border-slate-100 px-8 py-4 flex items-center justify-between z-30">
        <div className="flex gap-4">
          <button className="px-5 py-2.5 rounded-lg bg-surface-container text-primary text-sm font-bold hover:bg-surface-container-high transition-colors flex items-center gap-2">
            <Info className="w-4 h-4" />
            查看缺口解释
          </button>
          <button className="px-5 py-2.5 rounded-lg bg-error-container text-error text-sm font-bold hover:bg-error-container/80 transition-colors flex items-center gap-2">
            <CornerUpLeft className="w-4 h-4" />
            退回补充材料
          </button>
        </div>
        <div>
          <Link href="/cases/evidence">
            <button className="px-8 py-3 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
              进入一致性核验
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </footer>
    </>
  );
}
