'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ChartItem {
  id: string;
  title: string;
  co2SavingKg: number;
  effort: string;
}

export interface CarbonSavingsChartProps {
  data: ChartItem[];
  height?: number;
}

const EFFORT_COLOR: Record<string, string> = {
  quick: '#10b981',
  medium: '#f59e0b',
  major: '#3b82f6',
};

export function CarbonSavingsChart({ data, height = 260 }: CarbonSavingsChartProps) {
  const chartData = data.map((r) => ({
    name: r.title.length > 22 ? r.title.slice(0, 22) + '...' : r.title,
    co2SavingKg: r.co2SavingKg,
    effort: r.effort,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickFormatter={(v: number) => `${v} kg`}
        />
        <Tooltip
          formatter={(value: number) => [`${value.toLocaleString()} kg CO2/yr`, 'CO2 Reduction']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
        />
        <Bar dataKey="co2SavingKg" radius={[4, 4, 0, 0]}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={EFFORT_COLOR[d.effort] ?? '#6b7280'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
