'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function Header({ onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="h-16 border-b border-white/10 bg-[#050505] px-8 flex items-center justify-end sticky top-0 z-30">
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2 px-3 py-1.5 rounded-none bg-[#0d0d0d] hover:bg-white/5 border border-white/15 text-xs text-gray-300 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-400' : 'text-gray-400'}`} />
        <span>Sync</span>
      </button>
    </header>
  );
}
