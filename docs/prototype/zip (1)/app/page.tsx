import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AiAssistant from '@/components/AiAssistant';
import { Info, TrendingUp, Building2, CheckCircle2, AlertTriangle, Search, ChevronDown, Calendar, Check, Bolt } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  return (
    <>
      <Sidebar />
      <Header />
      
      <main className="ml-64 mt-16 p-8 min-h-screen bg-background text-on-surface font-body">
        {/* AI Intelligence Alert */}
        <div className="mb-10 p-4 bg-tertiary-container/5 rounded-xl flex items-center space-x-3 border border-tertiary-fixed-dim/20">
          <Info className="w-5 h-5 text-on-tertiary-container fill-on-tertiary-container/20" />
          <p className="text-on-tertiary-container font-medium text-sm">
            案件数据已同步自国担数字化平台 / 省级分中心 / 数据中台，系统已自动完成资料归集和初步结构化处理。
          </p>
        </div>

        {/* Asymmetric Stats Grid */}
        <section className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 lg:col-span-4 p-6 bg-surface-container-lowest rounded-xl shadow-[-20px_0_40px_rgba(11,28,48,0.04)]">
            <p className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold mb-2">待审案件数</p>
            <div className="flex items-end space-x-4">
              <span className="text-4xl font-black text-primary leading-none">128</span>
              <span className="text-xs text-error font-bold mb-1 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                较昨日 +12%
              </span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary w-2/3"></div>
            </div>
          </div>
          
          <div className="col-span-6 lg:col-span-2 p-6 bg-surface-container-lowest rounded-xl">
            <p className="text-xs text-on-surface-variant font-medium mb-1">AI 初检完成</p>
            <span className="text-2xl font-bold text-on-tertiary-container">94</span>
            <div className="mt-2 text-[10px] text-on-surface-variant">完成率 73.4%</div>
          </div>
          
          <div className="col-span-6 lg:col-span-2 p-6 bg-surface-container-lowest rounded-xl">
            <p className="text-xs text-on-surface-variant font-medium mb-1">待人工复核</p>
            <span className="text-2xl font-bold text-secondary">34</span>
            <div className="mt-2 text-[10px] text-on-surface-variant">高优处理 8</div>
          </div>
          
          <div className="col-span-6 lg:col-span-2 p-6 bg-surface-container-lowest rounded-xl">
            <p className="text-xs text-on-surface-variant font-medium mb-1">今日已提交 OA</p>
            <span className="text-2xl font-bold text-on-surface">16</span>
            <div className="mt-2 text-[10px] text-on-surface-variant">审批中 12</div>
          </div>
          
          <div className="col-span-6 lg:col-span-2 p-6 bg-error-container/30 border border-error-container rounded-xl">
            <p className="text-xs text-error font-bold mb-1">高风险待确认</p>
            <span className="text-2xl font-black text-error">5</span>
            <div className="mt-2 text-[10px] text-on-error-container">需立即介入</div>
          </div>
        </section>

        {/* Filter Area */}
        <section className="bg-surface-container-low rounded-xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">债务人名称</label>
              <input 
                type="text" 
                placeholder="搜索债务人名称..." 
                className="w-full bg-surface-container-lowest border-0 rounded-lg text-sm px-4 py-2.5 focus:ring-2 focus:ring-secondary/20 placeholder:text-slate-300 outline-none"
              />
            </div>
            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold text-on-surface-variant">担保机构</label>
              <div className="relative">
                <select className="w-full bg-surface-container-lowest border-0 rounded-lg text-sm px-4 py-2.5 focus:ring-2 focus:ring-secondary/20 appearance-none outline-none text-on-surface-variant">
                  <option>全部机构</option>
                  <option>宝鸡市中小企业融资担保有限公司</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">债权人</label>
              <input 
                type="text" 
                placeholder="输入银行名称..." 
                className="w-full bg-surface-container-lowest border-0 rounded-lg text-sm px-4 py-2.5 focus:ring-2 focus:ring-secondary/20 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">代偿日期区间</label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input type="text" placeholder="mm/dd/yyyy" className="w-full bg-surface-container-lowest border-0 rounded-lg text-xs px-3 py-2.5 outline-none" />
                  <Calendar className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <span className="text-slate-400">-</span>
                <div className="relative flex-1">
                  <input type="text" placeholder="mm/dd/yyyy" className="w-full bg-surface-container-lowest border-0 rounded-lg text-xs px-3 py-2.5 outline-none" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/40 pt-6">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-on-surface-variant">产品类别:</span>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-medium">全部</button>
                <button className="px-3 py-1.5 rounded-full bg-white text-slate-500 text-xs font-medium hover:bg-slate-50 transition-colors">政采贷</button>
                <button className="px-3 py-1.5 rounded-full bg-white text-slate-500 text-xs font-medium hover:bg-slate-50 transition-colors">科创担</button>
              </div>
            </div>
            <div className="h-4 w-px bg-slate-200"></div>
            <label className="flex items-center space-x-2 cursor-pointer group">
              <div className="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-secondary flex items-center justify-center transition-colors">
                <Check className="w-3.5 h-3.5 text-secondary opacity-0 group-hover:opacity-100" />
              </div>
              <span className="text-xs font-bold text-on-surface-variant">已完成 AI 初检</span>
            </label>
            <div className="ml-auto flex items-center space-x-3">
              <button className="text-xs font-bold text-secondary hover:underline underline-offset-4">重置筛选</button>
              <button className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">执行查询</button>
            </div>
          </div>
        </section>

        {/* Case List (Tonal Stacking) */}
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-12 px-6 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant/60">
            <div className="col-span-3">债务人 / 担保机构</div>
            <div className="col-span-2">债权人</div>
            <div className="col-span-2">主债权金额 / 代偿日期</div>
            <div className="col-span-2">当前状态</div>
            <div className="col-span-1 text-center">风险等级</div>
            <div className="col-span-2 text-right px-4">操作</div>
          </div>

          {/* List Item 1 */}
          <div className="grid grid-cols-12 items-center px-6 py-5 bg-surface-container-lowest rounded-xl hover:shadow-lg hover:shadow-slate-200/50 transition-all group">
            <div className="col-span-3">
              <h3 className="font-bold text-primary mb-1">宝鸡三家村餐饮管理有限公司</h3>
              <p className="text-xs text-on-surface-variant flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                宝鸡市中小企业融资担保有限公司
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-on-surface">陕西岐山农村商业银行</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-black text-primary">200 万元</p>
              <p className="text-xs text-on-surface-variant">2025-10-21</p>
            </div>
            <div className="col-span-2">
              <div className="flex flex-col">
                <span className="inline-flex items-center text-[10px] font-bold text-on-tertiary-container mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 fill-on-tertiary-container text-white" />
                  AI 初检已完成
                </span>
                <span className="text-xs font-medium text-secondary">待人工复核</span>
              </div>
            </div>
            <div className="col-span-1 text-center">
              <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-black rounded-full">中风险</span>
            </div>
            <div className="col-span-2 text-right px-4">
              <Link href="/review">
                <button className="px-5 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all">
                  开始审查
                </button>
              </Link>
            </div>
          </div>

          {/* List Item 2 */}
          <div className="grid grid-cols-12 items-center px-6 py-5 bg-surface-container-lowest rounded-xl hover:shadow-lg hover:shadow-slate-200/50 transition-all">
            <div className="col-span-3">
              <h3 className="font-bold text-primary mb-1">西安高新区科技贸易有限公司</h3>
              <p className="text-xs text-on-surface-variant flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                西安担保集团有限公司
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-on-surface">招商银行西安分行</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-black text-primary">850 万元</p>
              <p className="text-xs text-on-surface-variant">2025-10-22</p>
            </div>
            <div className="col-span-2">
              <span className="text-xs font-medium text-slate-400 italic">待归集资料...</span>
            </div>
            <div className="col-span-1 text-center">
              <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-black rounded-full">低风险</span>
            </div>
            <div className="col-span-2 text-right px-4">
              <button className="px-5 py-2 border border-outline-variant text-on-surface-variant rounded-lg text-xs font-bold hover:bg-slate-50 transition-all">
                查看详情
              </button>
            </div>
          </div>

          {/* List Item 3 (High Risk) */}
          <div className="grid grid-cols-12 items-center px-6 py-5 bg-surface-container-lowest rounded-xl border-l-4 border-error hover:shadow-lg transition-all">
            <div className="col-span-3">
              <h3 className="font-bold text-primary mb-1">渭南现代农业发展有限公司</h3>
              <p className="text-xs text-on-surface-variant flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                渭南市中小企业融资担保有限公司
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-on-surface">中国建设银行渭南分行</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-black text-primary">1,200 万元</p>
              <p className="text-xs text-on-surface-variant">2025-10-20</p>
            </div>
            <div className="col-span-2">
              <div className="flex flex-col">
                <span className="inline-flex items-center text-[10px] font-bold text-error mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  AI 初检异常
                </span>
                <span className="text-xs font-medium text-error">财务指标存疑</span>
              </div>
            </div>
            <div className="col-span-1 text-center">
              <span className="px-3 py-1 bg-error-container text-on-error-container text-[10px] font-black rounded-full">高风险</span>
            </div>
            <div className="col-span-2 text-right px-4">
              <button className="px-5 py-2 bg-error text-white rounded-lg text-xs font-bold hover:brightness-110 transition-all">
                紧急审查
              </button>
            </div>
          </div>
        </div>
      </main>

      <AiAssistant />
    </>
  );
}
