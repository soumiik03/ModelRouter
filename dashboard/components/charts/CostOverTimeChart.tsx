'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface CostOverTimeProps {
  data: Array<{ time: string; cost: number; baselineCost: number; requests: number }>;
}

export default function CostOverTimeChart({ data }: CostOverTimeProps) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="routerCostGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="baselineCostGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1c1e2d" vertical={false} />

          <XAxis
            dataKey="time"
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1c1e2d' }}
          />

          <YAxis
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1c1e2d' }}
            tickFormatter={(val) => `$${val}`}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#0c0d14',
              borderColor: '#222538',
              borderRadius: '8px',
              color: '#f3f4f6',
              fontSize: '12px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
            }}
            formatter={(value: any, name: any) => [
              formatCurrency(Number(value)),
              name === 'cost' ? 'Routed Cost' : 'Baseline Cost (Unrouted)',
            ]}
          />

          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', color: '#9ca3af', paddingBottom: '10px' }}
          />

          <Area
            type="monotone"
            dataKey="baselineCost"
            name="Baseline (Always Expensive)"
            stroke="#ef4444"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#baselineCostGradient)"
          />

          <Area
            type="monotone"
            dataKey="cost"
            name="ModelRouter Optimized"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#routerCostGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
