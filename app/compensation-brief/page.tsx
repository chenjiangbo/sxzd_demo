'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type CompensationData = {
  meta: {
    year: string;
    issue_number: string;
    total_issue: string;
    publish_date: string;
  };
  overview: {
    project_count: string;
    filing_amount: string;
    guarantee_amount: string;
    compensation_amount: string;
  };
};

export default function CompensationBriefPage() {
  const [data, setData] = useState<CompensationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/compensation-brief-data')
      .then((res) => res.json())
      .then((data) => {
        setData(data || null);
        setLoading(false);
      })
      .catch((error) => {
        console.error('加载代偿补偿数据失败:', error);
        setData(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <>
        <Sidebar />
        <Header />
        <main className="ml-48 min-h-screen bg-surface px-8 pb-32 pt-20">
          <div className="flex items-center justify-center py-20">
            <p className="text-lg font-bold text-on-surface-variant">正在加载代偿补偿数据...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <Header />

      <main className="ml-48 min-h-screen overflow-x-hidden bg-surface px-6 pb-8 pt-20">
        {/* 页面头部 */}
        <section className="mb-6 flex items-end justify-between gap-6">
          <div>
            <nav className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-on-surface-variant">
              <span>Admin</span>
              <span>/</span>
              <span>Task Center</span>
            </nav>
            <h1 className="font-headline text-[3.1rem] font-black leading-none tracking-tight text-primary">代偿补偿简报</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
              {data?.meta.year}年第{data?.meta.issue_number}期（总第{data?.meta.total_issue}期）全省再担保代偿补偿及风险情况通报。
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/compensation-brief/preview"
              className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(11,28,48,0.16)] transition hover:-translate-y-0.5"
            >
              生成简报
            </Link>
          </div>
        </section>

        {/* 统计卡片 */}
        <section className="mb-5 grid grid-cols-12 gap-3">
          <div className="col-span-12 rounded-3xl bg-white p-5 shadow-sm md:col-span-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-secondary">报告期间</span>
              <span className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-black text-secondary">{data?.meta.year} Task</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="font-headline text-[3.25rem] font-black leading-none text-primary">{data?.overview.project_count}</span>
              <span className="mb-1 text-base font-bold text-on-surface-variant">个项目</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">备案金额</p>
                <p className="mt-1 text-lg font-black text-primary">{data?.overview.filing_amount} <span className="text-xs font-semibold text-on-surface-variant">万元</span></p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">代偿补偿</p>
                <p className="mt-1 text-lg font-black text-primary">{data?.overview.compensation_amount} <span className="text-xs font-semibold text-on-surface-variant">万元</span></p>
              </div>
            </div>
          </div>

          <div className="col-span-6 rounded-3xl bg-surface-container-low p-5 shadow-sm md:col-span-4">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">数据来源</p>
            <p className="mt-2 text-[2rem] font-black text-primary">业务系统 <span className="text-sm font-semibold text-on-surface-variant">自动采集</span></p>
            <div className="mt-3 text-xs font-medium text-on-surface-variant">
              包含代偿补偿项目、合作银行、行业分布等核心指标
            </div>
          </div>

          <div className="col-span-6 rounded-3xl bg-surface-container-low p-5 shadow-sm md:col-span-4">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-white">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">简报格式</p>
            <p className="mt-2 text-[2rem] font-black text-primary">PDF <span className="text-sm font-semibold text-on-surface-variant">可转换</span></p>
            <div className="mt-3 text-xs font-medium text-on-surface-variant">
              支持导出为 HTML、PDF、Word 等多种格式文档
            </div>
          </div>
        </section>

        {/* 表格展示区域 */}
        <section className="min-w-0 overflow-hidden rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-headline text-xl font-black text-primary">代偿补偿业务统计表格</h2>
              <p className="mt-1.5 text-sm text-on-surface-variant">以下列表按 Excel 统计表逐行展示全部字段，可点击生成简报按钮导出 Word 文档。</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2">
                <span className="text-[11px] font-black text-on-surface-variant">年份</span>
                <div className="flex items-center gap-1.5">
                  <button className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-black text-white">2025</button>
                </div>
              </div>
            </div>
          </div>

          {/* 合作银行统计表 */}
          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <div className="max-w-full overflow-x-auto rounded-3xl border border-outline-variant/20 bg-surface-container-low">
              <table className="min-w-full border-collapse text-xs text-on-surface">
                <thead>
                  <tr className="border-b border-outline-variant/15 text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
                    <th className="px-4 py-3 whitespace-nowrap text-left">序号</th>
                    <th className="px-4 py-3 whitespace-nowrap text-left">合作<br/>银行</th>
                    <th className="px-4 py-3 whitespace-nowrap text-right">补偿<br/>金额</th>
                    <th className="px-4 py-3 whitespace-nowrap text-right">金额<br/>占比</th>
                    <th className="px-4 py-3 whitespace-nowrap text-right">笔数</th>
                    <th className="px-4 py-3 whitespace-nowrap text-right">笔数<br/>占比</th>
                    <th className="px-4 py-3 whitespace-nowrap text-right">笔均</th>
                    <th className="px-4 py-3 whitespace-nowrap text-right">合作业务<br/>代偿率</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-surface-container-low/40">
                    <td className="px-4 py-3 whitespace-nowrap font-bold">合计</td>
                    <td className="px-4 py-3 whitespace-nowrap"></td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">6,479.16</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">100.00%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">137</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">100.00%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">47.29</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">1.64</td>
                  </tr>
                  <tr className="bg-white">
                    <td colSpan={8} className="px-4 py-3 font-bold text-primary">一、国有大型银行</td>
                  </tr>
                  <tr className="bg-surface-container-low/40">
                    <td className="px-4 py-3 whitespace-nowrap">1</td>
                    <td className="px-4 py-3 whitespace-nowrap">邮储银行</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">2,609.63</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">40.28%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">26</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">18.98%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">100.37</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">1.93</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 whitespace-nowrap">2</td>
                    <td className="px-4 py-3 whitespace-nowrap">农业银行</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">532.28</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">8.22%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">40</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">29.20%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">13.31</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">1.67</td>
                  </tr>
                  <tr className="bg-surface-container-low/40">
                    <td className="px-4 py-3 whitespace-nowrap">3</td>
                    <td className="px-4 py-3 whitespace-nowrap">中国银行</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">521.82</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">8.05%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">5</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">3.65%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">104.36</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">1.55</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 whitespace-nowrap">4</td>
                    <td className="px-4 py-3 whitespace-nowrap">建设银行</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">472.13</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">7.29%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">8</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">5.84%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">59.02</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">0.97</td>
                  </tr>
                  <tr className="bg-surface-container-low/40">
                    <td className="px-4 py-3 whitespace-nowrap">5</td>
                    <td className="px-4 py-3 whitespace-nowrap">工商银行</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">223.58</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">3.45%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">4</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">2.92%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">55.90</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">1.49</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 whitespace-nowrap">6</td>
                    <td className="px-4 py-3 whitespace-nowrap">交通银行</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">37.69</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">0.58%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">1</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">0.73%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">37.69</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">0</td>
                  </tr>
                  <tr className="bg-surface-container-low/40">
                    <td colSpan={8} className="px-4 py-3 font-bold text-primary">二、全国股份制银行</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 whitespace-nowrap">7</td>
                    <td className="px-4 py-3 whitespace-nowrap">恒丰银行</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">160.00</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">2.47%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">1</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">0.73%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">160.00</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">0</td>
                  </tr>
                  <tr className="bg-surface-container-low/40">
                    <td className="px-4 py-3 whitespace-nowrap">8</td>
                    <td className="px-4 py-3 whitespace-nowrap">平安银行</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">59.98</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">0.93%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">1</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">0.73%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">59.98</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">0</td>
                  </tr>
                  <tr className="bg-white">
                    <td colSpan={8} className="px-4 py-3 font-bold text-primary">三、地方法人银行</td>
                  </tr>
                  <tr className="bg-surface-container-low/40">
                    <td className="px-4 py-3 whitespace-nowrap">9</td>
                    <td className="px-4 py-3 whitespace-nowrap">信合、村镇银行等</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">1,039.01</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">16.04%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">14</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">10.22%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">74.22</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">1.84</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 whitespace-nowrap">10</td>
                    <td className="px-4 py-3 whitespace-nowrap">重庆银行</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">160.00</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">2.47%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">1</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">0.73%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">160.00</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">15.38</td>
                  </tr>
                  <tr className="bg-surface-container-low/40">
                    <td className="px-4 py-3 whitespace-nowrap">11</td>
                    <td className="px-4 py-3 whitespace-nowrap">秦农银行</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">136.14</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">2.10%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">2</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">1.46%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">68.07</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">3.38</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 whitespace-nowrap">12</td>
                    <td className="px-4 py-3 whitespace-nowrap">西安银行</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">120.43</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">1.86%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">7</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">5.11%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">17.20</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">3.07</td>
                  </tr>
                  <tr className="bg-surface-container-low/40">
                    <td className="px-4 py-3 whitespace-nowrap">13</td>
                    <td className="px-4 py-3 whitespace-nowrap">北京银行</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">72.00</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">1.11%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">1</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">0.73%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">72.00</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">6.69</td>
                  </tr>
                  <tr className="bg-white">
                    <td colSpan={8} className="px-4 py-3 font-bold text-primary">四、互联网银行</td>
                  </tr>
                  <tr className="bg-surface-container-low/40">
                    <td className="px-4 py-3 whitespace-nowrap">14</td>
                    <td className="px-4 py-3 whitespace-nowrap">深圳微众银行</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">334.47</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">5.16%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">26</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">18.98%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">12.86</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">1.49</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 表格说明 */}
            <div className="mt-4 rounded-xl bg-surface-container-low p-4">
              <p className="text-[10px] font-medium text-on-surface-variant">
                <span className="font-bold">备注：</span>1.上表中合作业务代偿率为国担系统查询数据（包含国担"总对总"业务）。<br/>
                2. 按代偿补偿金额降序排列。<br/>
                3.合作业务代偿率是指2025年上半年合作银行与体系内担保机构备案业务担保代偿率。
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
