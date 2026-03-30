import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AiAssistant from '@/components/AiAssistant';
import { Clock, Zap, CheckSquare, Building2, Link, ArrowRightLeft, AlertTriangle, Send, Network, Save, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Sidebar />
      <Header />
      
      <main className="ml-64 mt-16 p-8 pb-32 min-h-screen w-full">
        {/* Business Process Steps */}
        <div className="flex justify-between items-center mb-10 px-4">
          <div className="flex items-center gap-4 w-full max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-secondary text-white text-[10px] flex items-center justify-center font-bold">01</span>
              <span className="text-xs font-bold text-primary">案件受理</span>
            </div>
            <div className="flex-1 h-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-6 h-6 rounded-full border border-slate-200 text-[10px] flex items-center justify-center font-bold">02</span>
              <span className="text-xs font-medium">自动核验</span>
            </div>
            <div className="flex-1 h-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-secondary text-white text-[10px] flex items-center justify-center font-bold shadow-lg shadow-secondary/20">03</span>
              <span className="text-xs font-bold text-primary underline decoration-secondary decoration-2 underline-offset-4">人工复核与 OA</span>
            </div>
            <div className="flex-1 h-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-6 h-6 rounded-full border border-slate-200 text-[10px] flex items-center justify-center font-bold">04</span>
              <span className="text-xs font-medium">结果反馈</span>
            </div>
          </div>
          <div className="bg-surface-container px-4 py-2 rounded-lg flex items-center gap-2">
            <Clock className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold text-primary">受理编号：BX-20231027-0042</span>
          </div>
        </div>

        {/* Hero AI Insight */}
        <section className="mb-10 relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-container p-10 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary-fixed-dim/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-tertiary-fixed-dim fill-tertiary-fixed-dim" />
                <span className="text-sm font-bold tracking-widest text-tertiary-fixed-dim uppercase">AI Agent Suggestion</span>
              </div>
              <h1 className="text-4xl font-black mb-2 font-headline tracking-tight">
                建议补偿金额 <span className="text-tertiary-fixed-dim">771,767.83</span> 元
              </h1>
              <p className="text-on-primary-container text-lg font-medium mt-4">
                当前案件规则核验通过率 98%，关键风险点已识别，建议进入 OA 流程审批。
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-lg border border-white/10 min-w-[120px]">
                <div className="text-[10px] text-on-primary-container font-bold uppercase mb-2">置信度</div>
                <div className="text-3xl font-black">94.5%</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-lg border border-white/10 min-w-[120px]">
                <div className="text-[10px] text-on-primary-container font-bold uppercase mb-2">风险级别</div>
                <div className="text-3xl font-black text-tertiary-fixed-dim">低</div>
              </div>
            </div>
          </div>
        </section>

        {/* Asymmetric Bento Grid Content */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Details & Risks */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
            
            {/* 待确认事项 */}
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-primary flex items-center gap-2 font-headline">
                  <CheckSquare className="w-5 h-5 text-secondary" />
                  待确认事项
                </h2>
                <span className="px-3 py-1 bg-secondary-container/20 text-secondary text-[10px] font-bold rounded-md">需人工核对 2 项</span>
              </div>
              <div className="space-y-4">
                <div className="p-5 rounded-lg bg-surface-container-low flex items-start gap-4 border-l-4 border-secondary">
                  <Building2 className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm mb-1 text-primary">法定代表人变更核对</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      系统监测到该项目法定代表人由 <span className="text-primary font-bold">刘红波</span> 变更为 <span className="text-primary font-bold">朱玉华</span>。请核对工商信息一致性及追偿责任书是否需重新签署。
                    </p>
                  </div>
                </div>
                <div className="p-5 rounded-lg bg-surface-container-low flex items-start gap-4 border-l-4 border-secondary">
                  <Link className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm mb-1 text-primary">业务链关联确认</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      该项目关联保函编号 BH-2022-X90 涉及共同担保人退出，需确认业务链条完整性。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 差异对比 */}
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
              <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2 font-headline">
                <ArrowRightLeft className="w-5 h-5 text-secondary" />
                差异对比 (申请 vs 建议)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">
                      <th className="px-5 py-4 rounded-l-lg">费用明细项</th>
                      <th className="px-5 py-4">申请方填写</th>
                      <th className="px-5 py-4">AI 测算建议</th>
                      <th className="px-5 py-4 rounded-r-lg">偏差率</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    <tr className="border-b border-surface-container-low">
                      <td className="px-5 py-5 font-bold text-primary">代偿本金</td>
                      <td className="px-5 py-5 text-on-surface-variant">750,000.00 元</td>
                      <td className="px-5 py-5 text-on-surface-variant">750,000.00 元</td>
                      <td className="px-5 py-5 text-secondary font-bold">0.00%</td>
                    </tr>
                    <tr className="border-b border-surface-container-low">
                      <td className="px-5 py-5 font-bold text-primary">滞纳金/罚息</td>
                      <td className="px-5 py-5 text-on-surface-variant">25,800.00 元</td>
                      <td className="px-5 py-5 text-on-surface-variant">21,767.83 元</td>
                      <td className="px-5 py-5 text-error font-bold">-15.62%</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-5 font-bold text-primary">诉讼费用</td>
                      <td className="px-5 py-5 text-on-surface-variant">0.00 元</td>
                      <td className="px-5 py-5 text-on-surface-variant">0.00 元</td>
                      <td className="px-5 py-5 text-slate-400">--</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 风险提示 */}
            <div className="bg-error-container/30 rounded-xl p-8 border border-error-container">
              <h2 className="text-lg font-bold text-on-error-container mb-5 flex items-center gap-2 font-headline">
                <AlertTriangle className="w-5 h-5 fill-error text-white" />
                风控红线预警
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-on-error-container">
                  <span className="w-1.5 h-1.5 rounded-full bg-error mt-2 shrink-0"></span>
                  <span className="leading-relaxed">反担保责任连续性风险：担保合同第 14 条款约定的豁免情形可能被触发。</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-on-error-container">
                  <span className="w-1.5 h-1.5 rounded-full bg-error mt-2 shrink-0"></span>
                  <span className="leading-relaxed">代位求偿权冲突风险：发现该债务人在其他银行有尚未清偿的抵押物。</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Right Column: Submission Panel & OA Node */}
          <div className="col-span-12 lg:col-span-5 space-y-8">
            
            {/* 操作面板 */}
            <div className="bg-primary text-white rounded-xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary opacity-20 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 font-headline relative z-10">
                <Send className="w-5 h-5 text-tertiary-fixed-dim" />
                最终审批操作
              </h2>
              <div className="space-y-6 relative z-10">
                <div>
                  <label className="text-[10px] font-bold text-on-primary-container uppercase tracking-widest block mb-2">当前业务名称</label>
                  <div className="text-sm font-bold bg-white/5 p-4 rounded-lg border border-white/10 leading-relaxed">
                    关于宝鸡三家村项目的代偿补偿申请
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-on-primary-container uppercase tracking-widest block mb-2">审批意见/备注</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-lg text-sm p-4 focus:ring-tertiary-fixed-dim focus:border-tertiary-fixed-dim h-32 outline-none placeholder:text-slate-400/50 resize-none transition-colors" 
                    placeholder="请输入复核意见..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* OA 流程预览 */}
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
              <h2 className="text-lg font-bold text-primary mb-8 flex items-center justify-between font-headline">
                <span className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-secondary" />
                  OA 流程节点预览
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">预计耗时：24h</span>
              </h2>
              
              <div className="relative space-y-10 pl-6 border-l-2 border-slate-100 ml-2">
                <div className="relative">
                  <div className="absolute -left-[35px] top-0 w-4 h-4 rounded-full bg-secondary border-4 border-white shadow-sm box-content"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">部门负责人审核</span>
                    <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded">张德厚</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">负责业务实质性与合规性初步核定</p>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-[35px] top-0 w-4 h-4 rounded-full bg-slate-200 border-4 border-white box-content"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-400">分管领导批示</span>
                    <span className="text-xs font-medium text-slate-300 bg-slate-50 px-2 py-0.5 rounded">李万山</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">负责财务额度与战略风险最终把控</p>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-[35px] top-0 w-4 h-4 rounded-full bg-slate-200 border-4 border-white box-content"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-400">董事长决议</span>
                    <span className="text-xs font-medium text-slate-300 bg-slate-50 px-2 py-0.5 rounded">王保国</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">单笔超 50 万需进入董事决策层级</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Fixed Footer Actions */}
      <footer className="fixed bottom-0 left-64 right-0 h-20 bg-white/90 backdrop-blur-xl flex items-center justify-between px-10 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-40 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-slate-500 hover:bg-slate-50 font-bold text-sm transition-colors border border-transparent hover:border-slate-200">
            <Save className="w-4 h-4" />
            暂存草稿
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-8 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
            退回补充材料
          </button>
          <button className="px-8 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95">
            采纳并提交 OA
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </footer>

      <AiAssistant />
    </>
  );
}
