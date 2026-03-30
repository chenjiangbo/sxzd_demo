import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Edit, 
  Rocket, 
  Zap, 
  ClipboardCheck, 
  Bot, 
  Minimize2, 
  History, 
  Send 
} from 'lucide-react';

export default function DocumentGeneration() {
  return (
    <>
      <Sidebar />
      <Header />
      
      <main className="ml-64 mt-16 p-8 min-h-screen bg-surface font-body">
        {/* Workflow Stepper */}
        <section className="mb-10 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[800px] bg-surface-container-low p-6 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-white flex items-center justify-center font-bold text-xs">01</div>
              <span className="text-sm font-bold text-primary">基础信息录入</span>
            </div>
            <div className="flex-1 h-px bg-slate-200 mx-4"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-white flex items-center justify-center font-bold text-xs">02</div>
              <span className="text-sm font-bold text-primary">合规性检查</span>
            </div>
            <div className="flex-1 h-px bg-slate-200 mx-4"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-lg ring-4 ring-primary/10">03</div>
              <span className="text-sm font-bold text-primary">文书智能生成</span>
            </div>
            <div className="flex-1 h-px bg-slate-200 mx-4"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center font-bold text-xs">04</div>
              <span className="text-sm font-medium text-slate-400">流程审批</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Documents Grid */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <div className="flex justify-between items-end">
              <h2 className="text-2xl font-black text-primary tracking-tight font-headline">AI 智能文书卡片</h2>
              <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                上次更新: 2026-03-20 14:30
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden ring-1 ring-slate-100">
                <div className="absolute top-0 right-0 p-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-tertiary-fixed-dim/20 text-on-tertiary-container font-bold">AI DRAFT</span>
                </div>
                <h3 className="text-sm font-bold text-primary mb-4 leading-relaxed h-10 overflow-hidden">《宝鸡三家村餐饮管理有限公司项目代偿补偿合规性自查工作底稿》</h3>
                <div className="flex justify-between items-center mt-6">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-error fill-error/20" />
                    <span className="text-xs font-bold text-error">3 处风险</span>
                  </div>
                  <button className="text-secondary text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    编辑 <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              {/* Card 2 */}
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm ring-2 ring-secondary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 flex gap-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-bold uppercase">Active</span>
                </div>
                <h3 className="text-sm font-bold text-primary mb-4 leading-relaxed h-10 overflow-hidden">《宝鸡三家村餐饮管理有限公司项目再担保代偿补偿审批表》</h3>
                <div className="flex justify-between items-center mt-6">
                  <div className="flex items-center gap-2 text-on-tertiary-container">
                    <CheckCircle2 className="w-4 h-4 fill-on-tertiary-container/20" />
                    <span className="text-xs font-bold">无已知风险</span>
                  </div>
                  <button className="text-secondary text-xs font-bold flex items-center gap-1">
                    编辑 <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              {/* Card 3 */}
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden ring-1 ring-slate-100">
                <div className="absolute top-0 right-0 p-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-tertiary-fixed-dim/20 text-on-tertiary-container font-bold">AI DRAFT</span>
                </div>
                <h3 className="text-sm font-bold text-primary mb-4 leading-relaxed h-10 overflow-hidden">《担保业务审批单-钟颖-2026-03-19》</h3>
                <div className="flex justify-between items-center mt-6">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                    <span className="text-xs font-bold text-amber-600">1 处提示</span>
                  </div>
                  <button className="text-secondary text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    编辑 <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Document Preview Area */}
            <div className="bg-surface-container-lowest p-10 rounded-xl shadow-lg border border-slate-50 min-h-[600px] relative">
              <div className="max-w-3xl mx-auto space-y-8 font-serif text-slate-800">
                <div className="text-center space-y-2">
                  <h4 className="text-xl font-bold tracking-widest text-primary font-headline uppercase">宝鸡三家村餐饮管理有限公司项目</h4>
                  <h4 className="text-xl font-bold tracking-widest text-primary font-headline uppercase">再担保代偿补偿审批表</h4>
                </div>
                
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    <tr>
                      <td className="border-y border-slate-200 py-4 font-bold w-1/4">直保机构名称</td>
                      <td className="border-y border-slate-200 py-4 px-4">宝鸡市金控融资担保有限公司</td>
                      <td className="border-y border-slate-200 py-4 font-bold w-1/4">案件受理编号</td>
                      <td className="border-y border-slate-200 py-4 px-4">CASE-BJ-2026-0042</td>
                    </tr>
                    <tr>
                      <td className="border-y border-slate-200 py-4 font-bold">借款企业</td>
                      <td className="border-y border-slate-200 py-4 px-4" colSpan={3}>宝鸡三家村餐饮管理有限公司</td>
                    </tr>
                    <tr>
                      <td className="border-y border-slate-200 py-4 font-bold">项目性质</td>
                      <td className="border-y border-slate-200 py-4 px-4">支农支小/再担保合作</td>
                      <td className="border-y border-slate-200 py-4 font-bold">担保金额</td>
                      <td className="border-y border-slate-200 py-4 px-4">2,000,000.00 元</td>
                    </tr>
                    <tr>
                      <td className="border-y border-slate-200 py-4 font-bold">申请代偿金额</td>
                      <td className="border-y border-slate-200 py-4 px-4 text-primary font-bold">1,543,535.66 元</td>
                      <td className="border-y border-slate-200 py-4 font-bold">申请补偿金额</td>
                      <td className="border-y border-slate-200 py-4 px-4 text-secondary font-bold">771,767.83 元</td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="space-y-4">
                  <p className="font-bold border-l-4 border-primary pl-4">一、代偿补偿背景说明</p>
                  <p className="leading-relaxed indent-8">鉴于借款人宝鸡三家村餐饮管理有限公司受宏观经济波动及餐饮行业阶段性调整影响，导致经营性现金流暂时性断裂。截至2026年03月15日，借款人在贷款银行出现逾期，直保机构已履行代偿责任...</p>
                </div>
                
                <div className="space-y-4">
                  <p className="font-bold border-l-4 border-primary pl-4">二、风险检查结论</p>
                  <p className="leading-relaxed indent-8">经AI智能风控引擎扫描，该项目原始申报资料完整。代偿确认书、追偿进展说明等要件齐全。补偿金额计算逻辑符合《省级政府性融资担保风险补偿资金管理办法》之规定比例（50%）...</p>
                </div>
              </div>
              
              {/* Floating Controls */}
              <div className="absolute bottom-8 right-8 flex gap-3">
                <button className="bg-surface-container-high text-primary px-6 py-3 rounded-lg font-bold text-sm hover:bg-surface-container-highest transition-colors">预览 PDF</button>
                <button className="bg-primary text-white px-8 py-3 rounded-lg font-bold text-sm shadow-xl shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-colors">
                  确认生成 <Rocket className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Side Panel: AI Specs & Assistant */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            {/* AI Analysis Card */}
            <section className="bg-surface-container-low p-8 rounded-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-tertiary-fixed-dim/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-on-tertiary-container fill-on-tertiary-container/20" />
                </div>
                <div>
                  <h3 className="font-bold text-primary font-headline">AI 生成说明</h3>
                  <p className="text-xs text-slate-500 font-medium">Agent Intelligence Spec</p>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center group">
                  <span className="text-xs text-slate-500">抽取企业信息</span>
                  <span className="text-xs font-bold text-primary px-2 py-1 bg-white rounded">匹配度 99%</span>
                </div>
                
                <div className="p-4 bg-white rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">企业全称</span>
                    <span className="text-xs font-bold">宝鸡三家村餐饮管理有限公司</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">统一信用代码</span>
                    <span className="text-xs font-mono font-medium">91610301MA6T...</span>
                  </div>
                </div>
                
                <div className="p-4 bg-white rounded-lg space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-slate-400">代偿金额</span>
                    <span className="text-lg font-black text-primary">1,543,535.66 <span className="text-[10px] font-normal">CNY</span></span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-slate-400">补偿金额 (50%)</span>
                    <span className="text-lg font-black text-secondary">771,767.83 <span className="text-[10px] font-normal">CNY</span></span>
                  </div>
                </div>
                
                <button className="w-full py-3 bg-white text-on-tertiary-container text-xs font-bold border border-tertiary-fixed-dim/30 rounded-lg hover:bg-tertiary-fixed-dim/5 transition-colors flex items-center justify-center gap-2">
                  <ClipboardCheck className="w-4 h-4" /> 重新扫描核心数据
                </button>
              </div>
            </section>

            {/* Mini AI Assistant */}
            <div className="bg-white/90 backdrop-blur-xl rounded-xl p-1 flex flex-col shadow-[-20px_0_40px_rgba(11,28,48,0.06)] border border-slate-100">
              <div className="p-5 flex justify-between items-center border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <Bot className="w-5 h-5 text-on-tertiary-container" />
                  <span className="font-bold text-primary text-sm font-headline">AI 智能助手</span>
                </div>
                <button className="text-slate-400 hover:text-primary transition-colors">
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs text-slate-600 leading-relaxed italic">"在该案件中，我已根据历史赔付记录和当前的合规规则自动填充了所有的金额项。您需要重点核对附件三中的追偿凭证是否完整。"</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-3 bg-surface-container-low rounded-lg flex flex-col items-center gap-2 hover:bg-surface-container transition-colors group">
                    <AlertTriangle className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-primary">风险预警</span>
                  </button>
                  <button className="p-3 bg-surface-container-low rounded-lg flex flex-col items-center gap-2 hover:bg-surface-container transition-colors group">
                    <History className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-primary">历史比对</span>
                  </button>
                </div>
                
                <div className="relative">
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border-none rounded-lg py-3 px-4 text-xs focus:ring-2 focus:ring-primary/20 outline-none" 
                    placeholder="向 AI 询问关于此文书的问题..." 
                  />
                  <button className="absolute right-2 top-1.5 p-1.5 text-primary hover:bg-slate-200 rounded-md transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
