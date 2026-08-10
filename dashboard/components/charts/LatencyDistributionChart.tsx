'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface LatencyProps {
  data: Array<{ range: string; count: number }>;
}

export default function LatencyDistributionChart({ data }: LatencyProps) {
  const getBarColor = (index: number) => {
    switch (index) {
      case 0: return '#10b981'; 
      case 1: return '#06b6d4'; 
      case 2: return '#8b5cf6'; 
      case 3: return '#f59e0b'; 
      default: return '#f43f5e'; 
    }
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c1e2d" vertical={false} />
          <XAxis
            dataKey="range"
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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0c0d14',
              borderColor: '#222538',
              borderRadius: '8px',
              color: '#f3f4f6',
              fontSize: '12px',
            }}
            formatter={(value: any) => [`${value} requests`, 'Count']}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
