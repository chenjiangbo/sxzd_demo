import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AiAssistant from '@/components/AiAssistant';
import { 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  FileSearch, 
  Database, 
  Sparkles,
  Verified
} from 'lucide-react';
import Link from 'next/link';

export default function EvidenceVerification() {
  return (
    <>
      <Sidebar />
      <Header />
      
      <main className="ml-64 pt-16 h-screen flex flex-col bg-background font-body">
        {/* Step Indicator */}
        <section className="bg-surface-container-low px-8 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">1</span>
            <span className="text-primary">受理登记</span>
          </div>
          <div className="h-px w-8 bg-outline-variant/30"></div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">2</span>
            <span className="text-primary">形式审查</span>
          </div>
          <div className="h-px w-8 bg-outline-variant/30"></div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-6 h-6 rounded-full border-2 border-secondary text-secondary flex items-center justify-center">3</span>
            <span className="text-secondary">证据核验</span>
          </div>
          <div className="h-px w-8 bg-outline-variant/30"></div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant/50">
            <span className="w-6 h-6 rounded-full border-2 border-outline-variant/30 flex items-center justify-center text-[10px]">4</span>
            <span>代偿决策</span>
          </div>
        </section>

        {/* Dynamic Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Column 1: PDF Viewer */}
          <section className="w-[35%] bg-surface-container border-r border-slate-100 flex flex-col">
            <div className="p-4 flex items-center justify-between bg-white/50 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primary">证据原件: 代偿申请书_0922.pdf</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-1 hover:bg-white rounded text-slate-500 hover:text-primary transition-colors">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button className="p-1 hover:bg-white rounded text-slate-500 hover:text-primary transition-colors">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button className="p-1 hover:bg-white rounded text-slate-500 hover:text-primary transition-colors">
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto bg-slate-200/50 flex flex-col items-center gap-8">
              {/* PDF Page 1 Simulation */}
              <div className="w-full max-w-md bg-white shadow-xl aspect-[1/1.4] p-10 relative overflow-hidden group">
                <div className="absolute top-24 left-10 right-10 bg-secondary/15 border border-secondary h-12 rounded-sm ring-2 ring-secondary/20"></div>
                <div className="space-y-4">
                  <div className="h-6 w-1/3 bg-slate-100 rounded"></div>
                  <div className="h-4 w-full bg-slate-50 rounded"></div>
                  <div className="h-4 w-5/6 bg-slate-50 rounded"></div>
                  <div className="h-4 w-full bg-slate-50 rounded"></div>
                  <div className="h-10"></div>
                  <div className="h-4 w-full bg-slate-50 rounded"></div>
                  <div className="h-4 w-3/4 bg-slate-50 rounded"></div>
                  <div className="h-4 w-full bg-slate-100 rounded"></div>
                  <div className="mt-8 flex justify-between">
                    <div className="w-24 h-24 border-2 border-dashed border-slate-200 rounded flex items-center justify-center">
                      <span className="text-[8px] text-slate-300">印章定位区</span>
                    </div>
                    <div className="w-32 h-6 bg-slate-100 rounded"></div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs font-bold text-primary bg-white/90 px-3 py-1.5 rounded-full shadow-lg">OCR 已识别: 98.4%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Column 2: Conclusion List */}
          <section className="w-[30%] bg-white flex flex-col border-r border-slate-100">
            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-primary">核验结论</h3>
              <div className="flex gap-1 p-1 bg-surface-container rounded-lg">
                <button className="px-3 py-1 text-[10px] font-bold rounded-md bg-white shadow-sm text-primary">全部</button>
                <button className="px-3 py-1 text-[10px] font-semibold text-on-surface-variant hover:text-primary">高风险</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-3">
                {/* Active Card */}
                <div className="p-4 rounded-xl bg-primary-container/10 border-l-4 border-secondary transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">身份一致性</span>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] font-bold">通过</span>
                  </div>
                  <h4 className="text-xs font-bold text-primary mb-1">社会信用代码核对一致</h4>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">申请书代码 (91110108MA01...) 与 工商系统信息 100% 匹配。</p>
                </div>
                
                {/* Card 2 */}
                <div className="p-4 rounded-xl bg-surface hover:bg-surface-container transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">债权核验</span>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] font-bold">通过</span>
                  </div>
                  <h4 className="text-xs font-bold text-primary mb-1">主债权金额一致</h4>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">合同金额 5,000,000.00 元，与代偿通知书金额一致。</p>
                </div>
                
                {/* Warning Card */}
                <div className="p-4 rounded-xl bg-error-container/20 border-l-4 border-error transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-error uppercase tracking-wider">变更审查</span>
                    <span className="px-2 py-0.5 rounded-full bg-error-container text-error text-[9px] font-bold">待复核</span>
                  </div>
                  <h4 className="text-xs font-bold text-primary mb-1">法定代表人变更说明</h4>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">检测到法人由 [张*] 变更为 [李*]，相关变更证明材料待核验。</p>
                </div>
                
                {/* Card 4 */}
                <div className="p-4 rounded-xl bg-surface hover:bg-surface-container transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">精算核对</span>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] font-bold">通过</span>
                  </div>
                  <h4 className="text-xs font-bold text-primary mb-1">代偿金额计算依据</h4>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">本金 + 利息(4.35%) + 罚息计算结果无误。</p>
                </div>
              </div>
            </div>
          </section>

          {/* Column 3: Evidence Details */}
          <section className="flex-1 bg-surface-container-low flex flex-col">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold font-headline text-primary">引用定位详情</h3>
                <div className="flex gap-2">
                  <button className="bg-primary text-white px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors">
                    <Verified className="w-4 h-4" />
                    一键确认为证据
                  </button>
                </div>
              </div>
              
              {/* Asymmetric Multi-Source Evidence Display */}
              <div className="grid grid-cols-1 gap-6">
                {/* Evidence Block 1 */}
                <div className="bg-white rounded-xl p-5 shadow-sm border-t-2 border-secondary relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-secondary/5 rounded-full"></div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-secondary/10 flex items-center justify-center text-secondary">
                        <FileSearch className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary">来源 A: 代偿申请书原文</p>
                        <p className="text-[10px] text-on-surface-variant">页码: P1 / 行号: L12-L14</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-secondary px-2 py-1 bg-secondary/10 rounded">Match: 100%</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg italic text-xs text-on-surface leading-loose border-l-2 border-slate-200">
                    "申请单位社会统一信用代码为 <span className="bg-secondary/20 font-bold px-1">91110108MA01XY7B2D</span>，法人代表张平，申请代偿金额共计伍佰万元整。"
                  </div>
                </div>
                
                {/* Evidence Block 2 */}
                <div className="bg-white rounded-xl p-5 shadow-sm relative overflow-hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-tertiary-fixed-dim/20 flex items-center justify-center text-on-tertiary-container">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary">来源 B: 国家企业信用信息公示系统</p>
                        <p className="text-[10px] text-on-surface-variant">查询时间: 2023-09-23 10:20:00</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-on-tertiary-container px-2 py-1 bg-tertiary-fixed-dim/20 rounded">Verify: Success</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[10px]">
                    <div className="space-y-1">
                      <p className="text-on-surface-variant">企业名称</p>
                      <p className="font-bold">某某融资担保有限公司</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-on-surface-variant">信用代码</p>
                      <p className="font-bold text-secondary">91110108MA01XY7B2D</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-on-surface-variant">注册资本</p>
                      <p className="font-bold">50,000,000.00 RMB</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-on-surface-variant">经营状态</p>
                      <p className="font-bold text-green-600">存续（在营、开业、在册）</p>
                    </div>
                  </div>
                </div>
                
                {/* AI Summary Block */}
                <div className="bg-tertiary-container text-tertiary-fixed p-6 rounded-xl relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold tracking-tight">AI 证据摘要</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    经交叉核验，该案件主体身份信息真实有效。社会信用代码在三方来源（申请书、工商系统、银行征信报告）中完全一致。建议通过身份完整性校验，关注点在于法人代表变更证书的有效性日期。
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <AiAssistant />
    </>
  );
}
