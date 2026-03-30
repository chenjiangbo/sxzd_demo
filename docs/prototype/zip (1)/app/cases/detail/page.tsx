import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AiAssistant from '@/components/AiAssistant';
import { 
  ArrowLeft, 
  ArrowRight, 
  Verified, 
  Building2, 
  Zap, 
  History, 
  Network, 
  CheckCircle2, 
  FileText, 
  AlertTriangle, 
  FileWarning 
} from 'lucide-react';
import Link from 'next/link';

export default function CaseDetail() {
  return (
    <>
      <Sidebar />
      <Header />
      
      <main className="pl-64 pr-80 pt-24 pb-12 px-10 min-h-screen bg-surface">
        {/* Action Header */}
        <div className="flex justify-between items-end mb-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-2">
              <ArrowLeft className="w-4 h-4" />
              <Link href="/" className="hover:text-primary transition-colors">案件管理</Link>
              <span>/</span>
              <span className="text-primary font-semibold">案件详情 (CAS-20251021-001)</span>
            </div>
            <h2 className="text-3xl font-headline font-extrabold text-primary tracking-tight">案件详情与材料地图</h2>
          </div>
          <button className="bg-primary text-white px-6 py-2.5 rounded-md font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:opacity-80 transition-all">
            <span>进入完整性检查</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Case Info (4 cols) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <span className="bg-primary-container/10 text-primary-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Basic Info</span>
                <Verified className="w-5 h-5 text-slate-300" />
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">债务人名称</label>
                  <p className="text-lg font-bold text-primary">宝鸡三家村餐饮管理有限公司</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">统一社会信用代码</label>
                    <p className="text-xs font-mono font-medium">91610323MA6XACQM0Y</p>
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">申请补偿金额</label>
                    <p className="text-lg font-black text-secondary">¥ 771,767.83</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50">
                  <label className="block text-xs text-on-surface-variant mb-3 font-semibold">关联信贷产品</label>
                  <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                    <Building2 className="w-5 h-5 text-primary-container fill-primary-container/20" />
                    <div>
                      <p className="text-xs font-bold text-primary">普惠金融-经营贷</p>
                      <p className="text-[10px] text-on-surface-variant">合作行：建设银行宝鸡分行</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Extraction Summary */}
            <div className="bg-primary-container text-white rounded-xl p-6 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-tertiary-fixed-dim fill-tertiary-fixed-dim" />
                  <span className="text-xs font-bold tracking-widest uppercase">AI Insights</span>
                </div>
                <p className="text-sm opacity-90 leading-relaxed mb-4">
                  系统已通过 OCR 及 NLP 语义分析，自动完成了 <span className="text-tertiary-fixed-dim font-bold">14 份</span> 文件的分类归口，识别出 <span className="text-tertiary-fixed-dim font-bold">3 处</span> 业务链关键风险点。
                </p>
                <div className="flex gap-2">
                  <span className="bg-white/10 px-2 py-1 rounded text-[10px] border border-white/20">主体一致性: 100%</span>
                  <span className="bg-white/10 px-2 py-1 rounded text-[10px] border border-white/20">金额匹配度: 高</span>
                </div>
              </div>
              <div className="absolute -bottom-8 -right-8 opacity-10">
                <Zap className="w-32 h-32" />
              </div>
            </div>
          </div>

          {/* Center: Timeline (4 cols) */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="font-headline font-bold text-primary mb-8 flex items-center gap-2">
              <History className="w-5 h-5 text-secondary" />
              业务时间轴
            </h3>
            <div className="flex-1 relative pl-6 space-y-10">
              <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-slate-100"></div>
              
              <div className="relative">
                <div className="absolute -left-7 top-1 w-3 h-3 rounded-full border-2 border-white bg-slate-300 ring-4 ring-slate-50"></div>
                <p className="text-[10px] font-bold text-on-surface-variant mb-1">2023-09</p>
                <p className="text-sm font-bold text-primary">首次备案</p>
                <p className="text-xs text-on-surface-variant mt-1">初始额度审批通过，业务正式进入库内管理</p>
              </div>
              
              <div className="relative">
                <div className="absolute -left-7 top-1 w-3 h-3 rounded-full border-2 border-white bg-slate-300 ring-4 ring-slate-50"></div>
                <p className="text-[10px] font-bold text-on-surface-variant mb-1">2024-08</p>
                <p className="text-sm font-bold text-primary">展期续接</p>
                <p className="text-xs text-on-surface-variant mt-1">借款人申请展期 12 个月，保后跟踪正常</p>
              </div>
              
              <div className="relative">
                <div className="absolute -left-7 top-1 w-3 h-3 rounded-full border-2 border-white bg-tertiary-fixed-dim ring-4 ring-tertiary-fixed-dim/10"></div>
                <p className="text-[10px] font-bold text-primary mb-1">2025-10-21</p>
                <p className="text-sm font-bold text-primary">代偿解保</p>
                <p className="text-xs text-on-surface-variant mt-1">发生风险违约，本公司执行代偿程序</p>
              </div>
              
              <div className="relative">
                <div className="absolute -left-7 top-1 w-3 h-3 rounded-full border-2 border-white bg-secondary ring-4 ring-secondary/10"></div>
                <p className="text-[10px] font-bold text-secondary mb-1">2025-12-09</p>
                <p className="text-sm font-bold text-secondary">提交补偿资料</p>
                <p className="text-xs text-on-surface-variant mt-1">进入补偿审核流程，资料包上传成功</p>
              </div>
              
              <div className="relative opacity-50">
                <div className="absolute -left-7 top-1 w-3 h-3 rounded-full border-2 border-white bg-slate-200 ring-4 ring-slate-50"></div>
                <p className="text-[10px] font-bold text-on-surface-variant mb-1">预计 2026-03-19</p>
                <p className="text-sm font-bold text-slate-400">审查成文</p>
              </div>
            </div>
          </div>

          {/* Right: Material Map (4 cols) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline font-bold text-primary flex items-center gap-2">
                  <Network className="w-5 h-5 text-primary" />
                  材料地图
                </h3>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Category 1 */}
                <div className="bg-surface-container-low/50 rounded-lg p-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-primary">代偿基础要件 (3)</span>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 hover:bg-white rounded group cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                        <span className="text-xs text-on-surface">代偿补偿函.pdf</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant">OCR 匹配</span>
                    </div>
                    <div className="flex items-center justify-between p-2 hover:bg-white rounded group cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                        <span className="text-xs text-on-surface">借款合同.pdf</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant">业务关联</span>
                    </div>
                    <div className="flex items-center justify-between p-2 hover:bg-white rounded group cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                        <span className="text-xs text-on-surface">保证合同.pdf</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant">法务核验</span>
                    </div>
                  </div>
                </div>

                {/* Category 2 */}
                <div className="bg-surface-container-low/50 rounded-lg p-4 border-l-4 border-l-amber-400 border-y border-r border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-primary">风控调查文件 (2)</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 hover:bg-white rounded group cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                        <span className="text-xs text-on-surface">风险预警月报.docx</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-error-container/20 rounded group cursor-pointer border border-error/10">
                      <div className="flex items-center gap-2">
                        <FileWarning className="w-4 h-4 text-error" />
                        <span className="text-xs text-error font-medium">缺失：现场核查记录表</span>
                      </div>
                      <AlertTriangle className="w-4 h-4 text-error" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Background Decoration */}
      <div className="fixed top-0 right-0 -z-10 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2"></div>
      <div className="fixed bottom-0 left-64 -z-10 w-[400px] h-[400px] bg-tertiary-fixed-dim/5 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4"></div>
      
      <AiAssistant />
    </>
  );
}
