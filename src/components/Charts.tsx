import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import type { Account } from '../types';

interface ChartsProps {
  accounts: Account[];
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];

export const Charts: React.FC<ChartsProps> = ({ accounts }) => {
  const [selectedLiabilityId, setSelectedLiabilityId] = useState<string>('all');

  // --- Data Prep: Overall Credit Card Debt Over Time ---
  const ccData = useMemo(() => {
    const creditCards = accounts.filter(a => a.type === 'credit_card');
    const dateMap = new Map<string, number>();
    
    creditCards.forEach(card => {
      card.history.forEach(entry => {
        const current = dateMap.get(entry.date) || 0;
        dateMap.set(entry.date, current + entry.balance);
      });
    });

    return Array.from(dateMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [accounts]);

  // --- Data Prep: Individual CCs Over Time ---
  const individualCCData = useMemo(() => {
    const creditCards = accounts.filter(a => a.type === 'credit_card');
    // Collect all unique dates
    const allDates = new Set<string>();
    creditCards.forEach(c => c.history.forEach(h => allDates.add(h.date)));
    
    const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return sortedDates.map(date => {
      const point: any = { date };
      creditCards.forEach(card => {
        // Find closest balance entry on or before this date
        const entry = card.history.find(h => h.date === date);
        if (entry) {
          point[card.name] = entry.balance;
        }
      });
      return point;
    });
  }, [accounts]);

  // --- Data Prep: Overall Liabilities (CC + Other) ---
  const totalLiabilitiesData = useMemo(() => {
    // If 'all' is selected, sum everything. If specific ID, show just that one.
    if (selectedLiabilityId !== 'all') {
      const account = accounts.find(a => a.id === selectedLiabilityId);
      if (!account) return [];
      return account.history
        .map(h => ({ date: h.date, amount: h.balance }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    const dateMap = new Map<string, number>();
    accounts.forEach(acc => {
      acc.history.forEach(entry => {
        const current = dateMap.get(entry.date) || 0;
        dateMap.set(entry.date, current + entry.balance);
      });
    });

    return Array.from(dateMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  }, [accounts, selectedLiabilityId]);

  return (
    <div className="space-y-8">
      
      {/* 1. Overall Credit Card Debt */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Total Credit Card Debt</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ccData}>
              <defs>
                <linearGradient id="colorCC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {month:'short', year: '2-digit'})} />
              <YAxis stroke="#64748b" tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip 
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Debt']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#ef4444" fillOpacity={1} fill="url(#colorCC)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Individual Credit Cards */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Credit Card Breakdown</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={individualCCData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {month:'short', year: '2-digit'})} />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend />
              {accounts.filter(a => a.type === 'credit_card').map((card, index) => (
                <Line 
                  key={card.id}
                  type="monotone" 
                  dataKey={card.name} 
                  stroke={COLORS[index % COLORS.length]} 
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Overall Liabilities with Filter */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-semibold text-slate-800">Liability Tracker</h3>
          <select 
            value={selectedLiabilityId}
            onChange={(e) => setSelectedLiabilityId(e.target.value)}
            className="block w-full sm:w-64 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-slate-50"
          >
            <option value="all">All Combined Liabilities</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name} ({acc.type.replace('_', ' ')})</option>
            ))}
          </select>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={totalLiabilitiesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {month:'short', year: '2-digit'})} />
              <YAxis stroke="#64748b" tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip 
                 formatter={(value: any) => [`$${value.toLocaleString()}`, 'Balance']}
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5'}} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};