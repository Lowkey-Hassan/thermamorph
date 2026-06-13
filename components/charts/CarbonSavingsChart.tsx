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

  const summary = data.length === 0
    ? 'Bar chart of CO2 savings by roadmap item. No roadmap items yet.'
    : `Bar chart of estimated annual CO2 savings by roadmap item: ${data
        .map((r) => `${r.title}, ${r.co2SavingKg.toLocaleString()} kilograms per year`)
        .join('; ')}.`;

  return (
    <div role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height={height} aria-hidden="true">
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
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
            contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', backgroundColor: '#1e293b', color: '#e2e8f0' }}
          />
          <Bar dataKey="co2SavingKg" radius={[4, 4, 0, 0]}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={EFFORT_COLOR[d.effort] ?? '#6b7280'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
