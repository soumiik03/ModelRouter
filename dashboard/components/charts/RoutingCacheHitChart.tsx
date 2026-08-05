'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface RoutingProps {
  data: Array<{ name: string; value: number; color: string }>;
}

export default function RoutingCacheHitChart({ data }: RoutingProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

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
              dataKey="value"
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
              formatter={(val: any, name: any) => [`${val}%`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Cache Hit</span>
          <span className="text-base font-extrabold text-emerald-400">
            {data.filter(d => d.name.toLowerCase().includes('cache')).reduce((a, b) => a + b.value, 0)}%
          </span>
        </div>
      </div>

      <div className="w-full md:w-1/2 space-y-2 overflow-y-auto max-h-60 pr-1">
        {data.map((item) => (
          <div
            key={item.name}
            className="p-2 rounded-lg bg-[#0e1018] border border-[#181a27] flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-semibold text-gray-200">{item.name}</span>
            </div>
            <span className="text-xs font-mono font-bold text-gray-300">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
