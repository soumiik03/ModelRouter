'use client';

import React from 'react';
import type { BudgetsData } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import { Wallet, ShieldAlert, DollarSign, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BudgetsViewProps {
  budgetsData: BudgetsData | null;
  loading: boolean;
}

export default function BudgetsView({ budgetsData, loading }: BudgetsViewProps) {
  if (loading || !budgetsData) {
    return (
      <div className="p-8 text-center text-gray-500 font-mono text-sm">
        <span className="inline-block animate-spin mr-2">⚡</span> Loading budget & cost control data...
      </div>
    );
  }

  const primaryUser = budgetsData.users[0] || {
    userId: 'Demo Account',
    budgetUsd: 1.00,
    spentUsd: 0.00,
    remainingUsd: 1.00,
    utilizationPercent: 0.0,
    isExceeded: false,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-b border-[#161824] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-violet-950/80 text-violet-300 border border-violet-700/50">
            Cost & Guardrails
          </span>
          <span className="text-xs text-gray-500 font-mono">Budget Enforcement</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          User Budget & Cost Control Dashboard
        </h1>
        <p className="text-xs text-gray-400 mt-1 max-w-3xl">
          Real-time budget tracking and guardrail enforcement. Automatically rejects requests when spent amount hits threshold with HTTP 429.
        </p>
      </div>

      {/* Requirement 6: Real Budget Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* User Budget */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27]">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">User Budget</span>
            <Wallet className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {formatCurrency(primaryUser.budgetUsd)}
          </div>
          <div className="mt-2 text-xs text-gray-500 font-mono">Allocated Limit</div>
        </div>

        {/* Spent Amount */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27]">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Spent Amount</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {formatCurrency(primaryUser.spentUsd)}
          </div>
          <div className="mt-2 text-xs text-gray-500 font-mono">Total Charged</div>
        </div>

        {/* Remaining Budget */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27]">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Remaining</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono">
            {formatCurrency(primaryUser.remainingUsd)}
          </div>
          <div className="mt-2 text-xs text-gray-500 font-mono">Available Credit</div>
        </div>

        {/* Budget Utilization */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27]">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Utilization</span>
            <span className="text-xs font-bold text-violet-400 font-mono">{primaryUser.utilizationPercent}%</span>
          </div>
          <div className="w-full bg-[#161826] h-3 rounded-full overflow-hidden mt-3 border border-[#222538]">
            <div
              className={`h-full transition-all duration-300 ${primaryUser.utilizationPercent >= 100 ? 'bg-rose-500' : primaryUser.utilizationPercent >= 80 ? 'bg-amber-500' : 'bg-violet-500'}`}
              style={{ width: `${Math.min(100, primaryUser.utilizationPercent)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 font-mono">Cap: 100%</div>
        </div>

        {/* Requests Rejected */}
        <div className="p-5 rounded-xl bg-[#0b0c10] border border-[#181a27]">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Rejections (429)</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {budgetsData.exceededCount}
          </div>
          <div className="mt-2 text-xs text-gray-500 font-mono">
            {budgetsData.exceededCount > 0 ? 'Over-budget users blocked' : '0 rejected requests'}
          </div>
        </div>
      </div>

      {/* User Budget Table */}
      <div className="p-6 rounded-xl bg-[#0b0c10] border border-[#181a27] shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Wallet className="w-4 h-4 text-violet-400" />
          Budget Accounts
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0e1018] text-gray-400 border-b border-[#181a27]">
              <tr>
                <th className="py-3 px-4 font-semibold">User ID</th>
                <th className="py-3 px-4 font-semibold text-right">Budget Limit</th>
                <th className="py-3 px-4 font-semibold text-right">Spent USD</th>
                <th className="py-3 px-4 font-semibold text-right">Remaining</th>
                <th className="py-3 px-4 font-semibold text-right">Utilization</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151724]">
              {budgetsData.users.map((u) => (
                <tr key={u.userId} className="hover:bg-[#0f111b] transition-colors">
                  <td className="py-3 px-4 text-white font-semibold">{u.userId === 'test_user_1' ? 'Default Account' : u.userId}</td>
                  <td className="py-3 px-4 text-right text-gray-200">{formatCurrency(u.budgetUsd)}</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-bold">{formatCurrency(u.spentUsd)}</td>
                  <td className="py-3 px-4 text-right text-cyan-400">{formatCurrency(u.remainingUsd)}</td>
                  <td className="py-3 px-4 text-right text-violet-400 font-bold">{u.utilizationPercent}%</td>
                  <td className="py-3 px-4 text-center">
                    {u.isExceeded ? (
                      <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800/50 text-[10px] font-bold">
                        EXCEEDED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
