'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { EnergyBreakdown } from '@/lib/types';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280'];

interface EnergyBreakdownChartProps {
  data: EnergyBreakdown[];
  height?: number;
}

export function EnergyBreakdownChart({ data, height = 280 }: EnergyBreakdownChartProps) {
  const summary = data.length === 0
    ? 'Pie chart of annual energy use by category. No breakdown data yet.'
    : `Pie chart of annual energy use by category: ${data
        .map((d) => `${d.category}, ${d.percentage}% (${d.kwhPerYear.toLocaleString()} kWh per year)`)
        .join('; ')}.`;

  return (
    <div role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height={height} aria-hidden="true">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={65}
            outerRadius={100}
            paddingAngle={3}
            dataKey="kwhPerYear"
            nameKey="category"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value.toLocaleString()} kWh/yr`,
              name,
            ]}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '13px',
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-xs text-slate-400">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
