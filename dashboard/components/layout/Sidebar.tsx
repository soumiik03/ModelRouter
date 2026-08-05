'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BarChart3, 
  ScrollText, 
  Sliders, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Server,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Eval Comparison', href: '/evals', icon: BarChart3, badge: 'Thesis' },
  { name: 'Request Logs', href: '/requests', icon: ScrollText },
  { name: 'Router Settings', href: '/settings', icon: Sliders },
];

const secondaryItems: NavItem[] = [
  { name: 'Upstash Redis', href: '#', icon: Zap },
  { name: 'Postgres DB', href: '#', icon: Layers },
  { name: 'OpenRouter API', href: '#', icon: Server },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#07080c] border-r border-[#161824] flex flex-col justify-between h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#161824]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-900/30 glow-purple">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          <div>
            <span className="font-bold text-white tracking-wide text-base block leading-none">
              Model<span className="text-violet-400">Router</span>
            </span>
            <span className="text-[11px] text-gray-500 font-medium">v1.0 • Chapter 7</span>
          </div>
        </div>

        {/* Primary Navigation */}
        <div className="px-3 py-6 space-y-1">
          <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
            Overview & Analytics
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname === '/' && item.href === '/dashboard');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-[#151724] text-white border border-violet-500/30 shadow-md shadow-violet-950/20'
                    : 'text-gray-400 hover:text-white hover:bg-[#0f111a]'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-violet-400' : 'text-gray-400 group-hover:text-gray-200'
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-violet-950 text-violet-300 border border-violet-700/50">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Secondary Integrations */}
        <div className="px-3 py-2 space-y-1">
          <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
            Connected Infrastructure
          </div>
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-gray-500 cursor-default hover:text-gray-400 hover:bg-[#0b0c12] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 text-gray-600" />
                  <span>{item.name}</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Status Pill */}
      <div className="p-4 border-t border-[#161824] bg-[#050508]">
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0e1018] border border-[#1c1e2e]">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-200 block leading-tight">Render Status</span>
              <span className="text-[10px] text-emerald-400 font-medium">All Systems Operational</span>
            </div>
          </div>
          <Activity className="w-4 h-4 text-gray-500" />
        </div>
      </div>
    </aside>
  );
}
