'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface ModelBreakdownProps {
  data: Array<{ name: string; requests: number; cost: number; color: string }>;
}

export default function CostPerModelBreakdown({ data }: ModelBreakdownProps) {
  const totalCost = data.reduce((acc, d) => acc + d.cost, 0);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 h-72">
      <div className="w-full md:w-1/2 h-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="requests"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#0b0c10" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0c0d14',
                borderColor: '#222538',
                borderRadius: '8px',
                color: '#f3f4f6',
                fontSize: '12px',
              }}
              formatter={(value: any, name: any, item: any) => [
                `${value} requests (${formatCurrency(item.payload.cost)})`,
                item.payload.name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Spend</span>
          <span className="text-sm font-extrabold text-white">{formatCurrency(totalCost)}</span>
        </div>
      </div>

      <div className="w-full md:w-1/2 space-y-2.5 overflow-y-auto max-h-60 pr-2">
        {data.map((item) => {
          const costPercentage = totalCost > 0 ? Math.round((item.cost / totalCost) * 100) : 0;
          return (
            <div
              key={item.name}
              className="p-2 rounded-lg bg-[#0e1018] border border-[#181a27] flex items-center justify-between hover:border-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-semibold text-gray-200 truncate">{item.name}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-mono text-gray-300 block">{item.requests} reqs</span>
                <span className="text-[10px] text-gray-500 font-mono">{formatCurrency(item.cost)} ({costPercentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
