'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '周一', auto: 40, manual: 24 },
  { name: '周二', auto: 30, manual: 13 },
  { name: '周三', auto: 20, manual: 48 },
  { name: '周四', auto: 27, manual: 39 },
  { name: '周五', auto: 18, manual: 48 },
  { name: '周六', auto: 23, manual: 38 },
  { name: '周日', auto: 34, manual: 43 },
];

export default function DashboardCharts() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorAuto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#005b4f" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#005b4f" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorManual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6bd8cb" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#6bd8cb" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
          labelStyle={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}
        />
        <Area type="monotone" dataKey="auto" name="自动核验" stroke="#005b4f" strokeWidth={3} fillOpacity={1} fill="url(#colorAuto)" />
        <Area type="monotone" dataKey="manual" name="人工复核" stroke="#6bd8cb" strokeWidth={3} fillOpacity={1} fill="url(#colorManual)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
