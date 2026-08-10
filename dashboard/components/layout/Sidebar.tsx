'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  GitFork, 
  Cpu, 
  Database, 
  Wallet, 
  BarChart3, 
  Sliders, 
  Zap, 
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
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Routing', href: '/routing', icon: GitFork },
  { name: 'Models', href: '/models', icon: Cpu },
  { name: 'Cache', href: '/cache', icon: Database },
  { name: 'Budgets', href: '/budgets', icon: Wallet },
  { name: 'Evaluation', href: '/evals', icon: BarChart3, badge: '60 Tasks' },
  { name: 'Settings / Status', href: '/settings', icon: Sliders },
];

const infrastructureItems: NavItem[] = [
  { name: 'Router API', href: '/settings', icon: Server },
  { name: 'Upstash Redis', href: '/cache', icon: Zap },
  { name: 'Postgres pgvector', href: '/cache', icon: Layers },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#07080c] border-r border-[#161824] flex flex-col justify-between h-screen sticky top-0 z-40 select-none">
      <div>
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#161824]">
          <div>
            <span className="font-bold text-white tracking-wide text-base block leading-none">
              Model<span className="text-violet-400">Router</span>
            </span>
            <span className="text-[11px] text-gray-500 font-medium">Observability Hub</span>
          </div>
        </div>

        <div className="px-3 py-5 space-y-1">
          <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
            Observability Navigation
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname === '/' && item.href === '/dashboard');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 group',
                  isActive
                    ? 'bg-orange-500/10 text-white border-l-2 border-orange-500 border-y border-r border-white/10'
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
                  <span className="px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide rounded bg-violet-950 text-violet-300 border border-violet-700/50">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="px-3 py-2 space-y-1">
          <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
            System Infrastructure
          </div>
          {infrastructureItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-[#0b0c12] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                  <span>{item.name}</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-[#161824] bg-[#050508]">
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0e1018] border border-[#1c1e2e]">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-200 block leading-tight">Router Connected</span>
              <span className="text-[10px] text-emerald-400 font-medium">Healthy</span>
            </div>
          </div>
          <Activity className="w-4 h-4 text-gray-500" />
        </div>
      </div>
    </aside>
  );
}
