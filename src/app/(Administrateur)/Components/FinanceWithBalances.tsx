// ============================================================================
// Component: FinanceWithBalances - Finance avec gestion soldes
// ============================================================================

"use client";

import React, { useState } from 'react';
import { Wallet, Users, ShieldCheck, FileText } from 'lucide-react';
import Finance from './Finance';
import BalanceManagement from './BalanceManagement';
import PaymentReleaseRules from './PaymentReleaseRules';
import WithdrawalManagement from './WithdrawalManagement';
import { useLanguageContext } from '@/contexts/LanguageContext';

interface FinanceWithBalancesProps {
  isDark: boolean;
}

export default function FinanceWithBalances({ isDark }: FinanceWithBalancesProps) {
  const { t } = useLanguageContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tAny = t as Record<string, any>;
  const [activeTab, setActiveTab] = useState<'overview' | 'balances' | 'withdrawals' | 'security'>('overview');

  const tabs = [
    { id: 'overview', label: tAny.admin?.financeWithBalances?.tabs?.overview || 'Vue d\'ensemble', icon: Wallet },
    { id: 'balances', label: tAny.admin?.financeWithBalances?.tabs?.balances || 'Gestion Soldes', icon: Users },
    { id: 'withdrawals', label: tAny.admin?.financeWithBalances?.tabs?.withdrawals || 'Retraits', icon: FileText },
    { id: 'security', label: tAny.admin?.financeWithBalances?.tabs?.security || 'Sécurité & Règles', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen">
      {/* Tabs Navigation */}
      <div className={`sticky top-0 z-20 border-b ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? isDark
                      ? 'border-blue-500 text-blue-400'
                      : 'border-blue-600 text-blue-600'
                    : isDark
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <Finance isDark={isDark} />}
        {activeTab === 'balances' && <BalanceManagement isDark={isDark} />}
        {activeTab === 'withdrawals' && <WithdrawalManagement isDark={isDark} />}
        {activeTab === 'security' && <PaymentReleaseRules isDark={isDark} />}
      </div>
    </div>
  );
}
