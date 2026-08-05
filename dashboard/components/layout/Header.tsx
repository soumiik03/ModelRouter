'use client';

import React, { useState } from 'react';
import { Search, RefreshCw, Clock, Sparkles, User, Database } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface HeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function Header({ onRefresh, isRefreshing }: HeaderProps) {
  const [timeRange, setTimeRange] = useState('24h');

  return (
    <header className="h-16 border-b border-[#161824] bg-[#07080c]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search prompts, task types, or model logs..."
            className="w-full bg-[#0e1018] border border-[#1a1c2a] rounded-lg pl-9 pr-12 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] text-gray-500 bg-[#161826] rounded border border-gray-700/50 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4">
        {/* Time Selector */}
        <div className="flex items-center bg-[#0e1018] border border-[#1a1c2a] p-1 rounded-lg">
          {['24h', '7d', '30d', 'All'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                timeRange === range
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30 shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Refresh Trigger */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1018] hover:bg-[#151724] border border-[#1a1c2a] text-xs text-gray-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-violet-400' : 'text-gray-400'}`} />
          <span>Sync</span>
        </button>

        <div className="h-4 w-px bg-[#1a1c2a]" />

        {/* User Profile Pill */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5">
            <div className="w-full h-full rounded-full bg-[#0b0c10] flex items-center justify-center">
              <User className="w-4 h-4 text-violet-300" />
            </div>
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-semibold text-gray-200">Admin User</div>
            <div className="text-[10px] text-gray-500">router@upstash.io</div>
          </div>
        </div>
      </div>
    </header>
  );
}
