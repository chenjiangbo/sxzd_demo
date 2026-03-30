import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AiAssistant from '@/components/AiAssistant';
import { 
  CheckCircle2, 
  FileSearch,
  Link as LinkIcon,
  AlertTriangle,
  ChevronRight,
  Calculator,
  ArrowRight,
  FileText,
  ExternalLink,
  Gavel,
  Receipt,
  ListChecks,
  BarChart2
} from 'lucide-react';

export default function VerifyPage() {
  return (
    <>
      <Sidebar />
      <Header />
      
      <main className="pl-64 pr-16 pt-16 min-h-screen bg-surface">
        <div className="p-8 max-w-[1600px] mx-auto">
          {/* Business Steps Header */}
          <div className="mb-10 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-secondary mb-2 block">Case ID: #BJ-20240522-009</span>
              <h3 className="text-2xl font-bold text-primary font-headline">北京科创实业发展有限公司 - 代偿申请核验</h3>
            </div>
            <div className="flex gap-4">
              <button className="px-6 py-2 bg-surface-container-lowest text-primary font-bold rounded-md border border-outline-variant/20 hover:bg-surface-container-low transition-all">驳回申请</button>
              <button className="px-6 py-2 bg-primary text-white font-bold rounded-md shadow-lg shadow-primary/20 hover:opacity-90 transition-all">提交至 OA 审批</button>
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-5 gap-4 mb-10">
            <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-2 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
              <span className="text-[10px] font-bold text-secondary uppercase">Step 01</span>
              <span className="text-sm font-bold text-primary">案件材料受理</span>
              <CheckCircle2 className="text-secondary absolute -right-2 -bottom-2 w-16 h-16 opacity-10" />
            </div>
            <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-2 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
              <span className="text-[10px] font-bold text-secondary uppercase">Step 02</span>
              <span className="text-sm font-bold text-primary">完整性初筛</span>
              <CheckCircle2 className="text-secondary absolute -right-2 -bottom-2 w-16 h-16 opacity-10" />
            </div>
            <div className="bg-primary p-4 rounded-lg flex flex-col gap-2 relative overflow-hidden shadow-xl shadow-primary/20">
              <span className="text-[10px] font-bold text-primary-fixed uppercase">Step 03</span>
              <span className="text-sm font-bold text-white">核验与规则校验</span>
              <ListChecks className="text-white absolute -right-2 -bottom-2 w-16 h-16 opacity-20" />
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/10 p-4 rounded-lg flex flex-col gap-2 relative overflow-hidden">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase">Step 04</span>
              <span className="text-sm font-bold text-on-surface-variant">补偿金额确认</span>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/10 p-4 rounded-lg flex flex-col gap-2 relative overflow-hidden">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase">Step 05</span>
              <span className="text-sm font-bold text-on-surface-variant">复核与终审</span>
            </div>
          </div>

          {/* Dashboard Grid Layout */}
          <div className="grid grid-cols-12 gap-6">
            {/* Section 1: Field Consistency */}
            <div className="col-span-12 xl:col-span-8 space-y-6">
              <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <FileSearch className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-primary">字段一致性核验</h4>
                      <p className="text-xs text-on-surface-variant">多维数据来源比对 (系统数据 vs 合同原文 vs 申报单)</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-tertiary-fixed-dim/20 text-on-tertiary-container text-[10px] font-bold rounded-full border border-tertiary-fixed-dim/30">AI 自动匹配中</span>
                </div>
                
                <div className="overflow-x-auto border border-outline-variant/10 rounded-lg">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-surface-container-low text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-wider">
                        <th className="px-6 py-4">字段名称</th>
                        <th className="px-6 py-4">申报系统记录</th>
                        <th className="px-6 py-4">电子合同原文</th>
                        <th className="px-6 py-4">一致性状态</th>
                        <th className="px-6 py-4">证据引用</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      <tr className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-primary">债务人名称</td>
                        <td className="px-6 py-4">北京科创实业发展有限公司</td>
                        <td className="px-6 py-4">北京科创实业发展有限公司</td>
                        <td className="px-6 py-4 text-tertiary-container">
                          <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> 一致</span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-secondary text-xs font-bold hover:underline flex items-center gap-1"><LinkIcon className="w-3.5 h-3.5" /> [主合同 P2]</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-primary">社会信用代码</td>
                        <td className="px-6 py-4">91110108MA017***3A</td>
                        <td className="px-6 py-4">91110108MA017***3A</td>
                        <td className="px-6 py-4 text-tertiary-container">
                          <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> 一致</span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-secondary text-xs font-bold hover:underline flex items-center gap-1"><LinkIcon className="w-3.5 h-3.5" /> [执照 P1]</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low/30 transition-colors bg-error-container/5">
                        <td className="px-6 py-4 font-semibold text-primary">合同总金额</td>
                        <td className="px-6 py-4">¥ 1,500,000.00</td>
                        <td className="px-6 py-4 text-error font-bold italic underline decoration-dotted">¥ 1,550,000.00</td>
                        <td className="px-6 py-4 text-error">
                          <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> 不一致</span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-secondary text-xs font-bold hover:underline flex items-center gap-1"><LinkIcon className="w-3.5 h-3.5" /> [主合同 P5]</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-primary">到期日期</td>
                        <td className="px-6 py-4">2024-04-15</td>
                        <td className="px-6 py-4">2024-04-15</td>
                        <td className="px-6 py-4 text-tertiary-container">
                          <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> 一致</span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-secondary text-xs font-bold hover:underline flex items-center gap-1"><LinkIcon className="w-3.5 h-3.5" /> [借据 P1]</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Section 2: Rule Results Card */}
                <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <ListChecks className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-primary">规则校验结果</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low group cursor-pointer hover:bg-surface-container transition-all">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-tertiary-fixed-dim fill-tertiary-fixed-dim/20" />
                        <span className="text-sm font-semibold text-primary">担保对象合规性</span>
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant bg-white px-2 py-0.5 rounded shadow-sm">通过</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low group cursor-pointer hover:bg-surface-container transition-all">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-tertiary-fixed-dim fill-tertiary-fixed-dim/20" />
                        <span className="text-sm font-semibold text-primary">申报时效合规</span>
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant bg-white px-2 py-0.5 rounded shadow-sm">通过</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-error-container/10 border border-error/10 group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-error fill-error/20" />
                        <span className="text-sm font-semibold text-error">贷款用途真实性比对</span>
                      </div>
                      <span className="text-[10px] font-bold text-error bg-white px-2 py-0.5 rounded shadow-sm">待人工干预</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-outline-variant/10 text-center">
                    <button className="text-secondary text-xs font-bold hover:underline flex items-center justify-center gap-2 mx-auto">
                      查看全部 12 条规则细节 <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </section>

                {/* Section 3: AI Calc Card */}
                <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-tertiary-fixed-dim/20 relative">
                  <div className="absolute top-0 right-0 p-4">
                    <Calculator className="w-12 h-12 text-tertiary-fixed-dim opacity-20" />
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-tertiary-fixed-dim/10 flex items-center justify-center text-tertiary-container">
                      <BarChart2 className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-primary">AI 智能计算引擎</h4>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">申报时效已过</span>
                        <div className="text-2xl font-black text-primary">49 <span className="text-sm font-normal text-on-surface-variant">天</span></div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">解保宽限期</span>
                        <div className="text-2xl font-black text-primary">60 <span className="text-sm font-normal text-on-surface-variant">天</span></div>
                      </div>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-lg">
                      <span className="text-[10px] text-secondary font-bold uppercase tracking-tighter mb-1 block">预计补贴金额</span>
                      <div className="text-3xl font-black text-secondary">771,767.83 <span className="text-sm font-normal">CNY</span></div>
                      <p className="text-[10px] text-on-surface-variant/60 mt-2">*基于代偿率 50% 自动测算，已扣除担保费利息</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Section 4: AI Risk Alert & Evidence */}
            <div className="col-span-12 xl:col-span-4 space-y-6">
              <section className="bg-primary text-white rounded-xl p-6 shadow-2xl shadow-primary/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary opacity-20 -mr-16 -mt-16 rounded-full blur-3xl"></div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-tertiary-fixed-dim">
                    <AlertTriangle className="w-5 h-5 fill-tertiary-fixed-dim/20" />
                  </div>
                  <h4 className="text-lg font-bold">AI 风险深度提醒</h4>
                </div>
                <div className="space-y-4 relative z-10">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase text-tertiary-fixed-dim">主体变动</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h5 className="text-sm font-bold mb-1">法定代表人于 3 个月前变更</h5>
                    <p className="text-xs text-slate-400">检测到李建华替换王志刚，关联企业存在诉讼纠纷，需核对担保意愿真实性。</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase text-secondary-fixed-dim">关联链条</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h5 className="text-sm font-bold mb-1">业务续接关系高度疑似</h5>
                    <p className="text-xs text-slate-400">本笔借款与该企业 2023 年已结清的 #ZJ-001 业务在资金流向存在 85% 重合。</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase text-error">用途异常</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h5 className="text-sm font-bold mb-1">借款用途历史追溯预警</h5>
                    <p className="text-xs text-slate-400">部分资金疑似回流至实际控制人个人账户，建议启动二级深度穿透审查。</p>
                  </div>
                </div>
                <button className="w-full mt-6 py-3 bg-secondary text-white font-bold rounded-lg text-sm shadow-lg hover:scale-[0.98] active:opacity-80 transition-all">
                  启动 AI 穿透式扫描
                </button>
              </section>

              {/* Mini Evidence View */}
              <section className="bg-surface-container rounded-xl p-6">
                <h4 className="text-sm font-bold text-primary mb-4">待审核心证据库</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-white rounded-md border border-outline-variant/20 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="w-10 h-10 bg-surface-container-low flex items-center justify-center text-primary rounded">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold">流动资金借款合同.pdf</div>
                      <div className="text-[9px] text-on-surface-variant">OCR 识别度: 99.8%</div>
                    </div>
                    <button className="text-secondary p-1 hover:bg-surface-container rounded"><ExternalLink className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-white rounded-md border border-outline-variant/20 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="w-10 h-10 bg-surface-container-low flex items-center justify-center text-primary rounded">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold">还款流水明细_2024Q1.xlsx</div>
                      <div className="text-[9px] text-on-surface-variant">数据点: 1,240 个</div>
                    </div>
                    <button className="text-secondary p-1 hover:bg-surface-container rounded"><ExternalLink className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-white rounded-md border border-outline-variant/20 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="w-10 h-10 bg-surface-container-low flex items-center justify-center text-primary rounded">
                      <Gavel className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold">法律意见书_加盖电子签.pdf</div>
                      <div className="text-[9px] text-on-surface-variant">已完成 CA 核验</div>
                    </div>
                    <button className="text-secondary p-1 hover:bg-surface-container rounded"><ExternalLink className="w-4 h-4" /></button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <AiAssistant />
    </>
  );
}
