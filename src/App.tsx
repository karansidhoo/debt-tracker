import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  Home, 
  Car, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Trash2, 
  BrainCircuit, 
  PieChart, 
  Activity,
  AlertCircle,
  Settings
} from 'lucide-react';
import { INITIAL_ACCOUNTS, type Account, type AccountType } from './types';
import { Charts } from './components/Charts';
import { getDebtAnalysis } from './services/geminiService';

// --- Helper Components ---

const StatTile: React.FC<{ title: string; value: string; subtext?: string; icon: React.ReactNode; colorClass: string }> = ({ title, value, subtext, icon, colorClass }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-start justify-between transition-transform hover:-translate-y-1 duration-200">
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass} text-white`}>
      {icon}
    </div>
  </div>
);

const AddBalanceModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  accounts: Account[]; 
  onUpdate: (accountId: string, newBalance: number, date: string) => void 
}> = ({ isOpen, onClose, accounts, onUpdate }) => {
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Update selected account when accounts change or modal opens
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountId && amount && date) {
      onUpdate(accountId, parseFloat(amount), date);
      setAmount('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Update Balance</h2>
        {accounts.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-slate-500 mb-4">You have no accounts to update.</p>
            <button onClick={onClose} className="text-indigo-600 font-medium hover:underline">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Account</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input 
                type="date" 
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Balance ($)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900 placeholder-slate-400"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={onClose} className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 bg-white">Cancel</button>
              <button type="submit" className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md">Update</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const AddAccountModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (account: Omit<Account, 'id' | 'history'> & { initialBalance: number, date: string }) => void;
}> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('credit_card');
  const [rate, setRate] = useState('');
  const [balance, setBalance] = useState('');
  
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && rate && balance) {
      onAdd({
        name,
        type,
        interestRate: parseFloat(rate),
        initialBalance: parseFloat(balance),
        date: new Date().toISOString().split('T')[0]
      });
      setName('');
      setRate('');
      setBalance('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Liability</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
            <input type="text" required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900 placeholder-slate-400" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Visa Gold" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" value={type} onChange={e => setType(e.target.value as AccountType)}>
              <option value="credit_card">Credit Card</option>
              <option value="loan">Personal Loan</option>
              <option value="mortgage">Mortgage</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (%)</label>
              <input type="number" step="0.01" required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900 placeholder-slate-400" value={rate} onChange={e => setRate(e.target.value)} placeholder="18.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Balance</label>
              <input type="number" step="0.01" required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900 placeholder-slate-400" value={balance} onChange={e => setBalance(e.target.value)} placeholder="1000" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 bg-white">Cancel</button>
            <button type="submit" className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md">Add Account</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSave: (key: string) => void;
  onReset: () => void;
}> = ({ isOpen, onClose, apiKey, onSave, onReset }) => {
  const [keyInput, setKeyInput] = useState(apiKey);

  useEffect(() => {
    setKeyInput(apiKey);
  }, [apiKey, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(keyInput);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear all data? This cannot be undone and will delete all accounts.")) {
      onReset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-6 w-6 text-slate-600" />
          <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Google Gemini API Key</label>
            <input 
              type="password" 
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900 placeholder-slate-400"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
            />
            <p className="text-xs text-slate-500 mt-2">
              Your API key is stored locally in your browser and used only to fetch debt advice. 
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline ml-1">Get a key here</a>.
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 bg-white">Cancel</button>
            <button type="submit" className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md">Save</button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <h3 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Danger Zone
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Resetting your data will permanently delete all tracked accounts and history. This action cannot be undone.
          </p>
          <button 
            type="button" 
            onClick={handleReset}
            className="w-full py-2 px-4 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
          >
            Reset All Data & Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---

const App: React.FC = () => {
  // State
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('debtTracker_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('debtTracker_accounts', JSON.stringify(accounts));
  }, [accounts]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleResetData = () => {
    setAccounts([]);
    // The useEffect above will sync this empty array to localStorage automatically
  };

  // Actions
  const handleAddBalance = (accountId: string, balance: number, date: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== accountId) return acc;
      // Add and sort by date
      const newHistory = [...acc.history, { date, balance }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return { ...acc, history: newHistory };
    }));
  };

  const handleAddAccount = (data: Omit<Account, 'id' | 'history'> & { initialBalance: number, date: string }) => {
    const newAccount: Account = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      type: data.type,
      interestRate: data.interestRate,
      history: [{ date: data.date, balance: data.initialBalance }]
    };
    setAccounts(prev => [...prev, newAccount]);
  };

  const handleDeleteAccount = (id: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      setAccounts(prev => prev.filter(a => a.id !== id));
    }
  };

  const fetchAIAdvice = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    const result = await getDebtAnalysis(accounts, apiKey);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  // Derived Data
  const creditCards = useMemo(() => 
    accounts
      .filter(a => a.type === 'credit_card')
      .sort((a, b) => b.interestRate - a.interestRate), // Strategy: Highest Interest First
  [accounts]);

  const otherLiabilities = useMemo(() => 
    accounts.filter(a => a.type !== 'credit_card'), 
  [accounts]);

  const totalLiabilities = accounts.reduce((sum, acc) => {
    const last = acc.history[acc.history.length - 1];
    return sum + (last ? last.balance : 0);
  }, 0);

  const totalCCDebt = creditCards.reduce((sum, acc) => {
    const last = acc.history[acc.history.length - 1];
    return sum + (last ? last.balance : 0);
  }, 0);

  const totalDebtReduced = useMemo(() => {
    let startTotal = 0;
    let currentTotal = 0;
    accounts.forEach(acc => {
      if (acc.history.length > 0) {
        startTotal += acc.history[0].balance;
        currentTotal += acc.history[acc.history.length - 1].balance;
      }
    });
    return startTotal - currentTotal;
  }, [accounts]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">DebtSnowball Tracker</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsUpdateModalOpen(true)}
                className="hidden sm:flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                disabled={accounts.length === 0}
              >
                <Plus className="h-4 w-4" /> Update Balance
              </button>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Dashboard Tiles */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatTile 
            title="Total Liabilities" 
            value={`$${totalLiabilities.toLocaleString()}`} 
            subtext={accounts.length === 0 ? "No active accounts" : "All accounts combined"}
            icon={<DollarSign className="h-6 w-6" />}
            colorClass="bg-indigo-500"
          />
          <StatTile 
            title="Credit Card Debt" 
            value={`$${totalCCDebt.toLocaleString()}`} 
            subtext={`${creditCards.length} active cards`}
            icon={<CreditCard className="h-6 w-6" />}
            colorClass="bg-rose-500"
          />
          <StatTile 
            title="Debt Reduced" 
            value={`$${totalDebtReduced.toLocaleString()}`} 
            subtext="Since tracking began"
            icon={<Activity className="h-6 w-6" />}
            colorClass="bg-emerald-500"
          />
        </section>

        {/* Action Bar for Mobile */}
        <div className="sm:hidden flex flex-col gap-3">
           <button 
                onClick={() => setIsUpdateModalOpen(true)}
                className="w-full flex justify-center items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={accounts.length === 0}
              >
                <Plus className="h-4 w-4" /> Update Balances
          </button>
        </div>

        {/* AI Advisor Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <BrainCircuit className="h-8 w-8 text-indigo-200" />
              <h2 className="text-2xl font-bold">AI Debt Advisor</h2>
            </div>
            {!aiAnalysis ? (
              <div className="max-w-xl">
                <p className="text-indigo-100 mb-6">Get personalized insights and a payoff strategy based on your current liability portfolio. Our AI analyzes your interest rates and balances to suggest the best path forward.</p>
                {apiKey ? (
                  <button 
                    onClick={fetchAIAdvice} 
                    disabled={isAnalyzing || accounts.length === 0}
                    className="bg-white text-indigo-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-70 flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>Processing...</>
                    ) : accounts.length === 0 ? (
                      <>Add Accounts First</>
                    ) : (
                      <>Analyze My Debt</>
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="bg-white/20 backdrop-blur-sm text-white border border-white/40 px-6 py-2.5 rounded-lg font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" /> Configure API Key
                  </button>
                )}
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-indigo-50 prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap font-light text-sm md:text-base leading-relaxed">
                    {aiAnalysis}
                  </div>
                </div>
                <button onClick={() => setAiAnalysis(null)} className="mt-4 text-sm text-indigo-200 hover:text-white underline">Close Analysis</button>
              </div>
            )}
          </div>
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
        </section>

        {/* Charts Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-slate-500" />
              Visual Analytics
            </h2>
          </div>
          {accounts.length > 0 ? (
            <Charts accounts={accounts} />
          ) : (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-400">
              <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Add accounts to see visual analytics.</p>
            </div>
          )}
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Credit Cards Strategy List */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-rose-500" />
                  Credit Card Strategy
                </h3>
                <p className="text-sm text-slate-500 mt-1">Avalanche Method: Highest Rate First</p>
              </div>
              <button onClick={() => setIsAddAccountModalOpen(true)} className="text-sm text-indigo-600 font-medium hover:text-indigo-800">+ Add New</button>
            </div>
            <div className="divide-y divide-slate-100">
              {creditCards.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No credit cards added yet.</div>
              ) : (
                creditCards.map((card, index) => {
                  const currentBalance = card.history[card.history.length - 1]?.balance || 0;
                  return (
                    <div key={card.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${index === 0 ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-500 ring-offset-2' : 'bg-slate-100 text-slate-500'}`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{card.name}</h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">
                            {card.interestRate}% APR
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">${currentBalance.toLocaleString()}</p>
                        <div className="flex items-center justify-end gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleDeleteAccount(card.id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Other Liabilities List */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Home className="h-5 w-5 text-indigo-500" />
                  Other Liabilities
                </h3>
                <p className="text-sm text-slate-500 mt-1">Loans, Mortgages, etc.</p>
              </div>
              <button onClick={() => setIsAddAccountModalOpen(true)} className="text-sm text-indigo-600 font-medium hover:text-indigo-800">+ Add New</button>
            </div>
            <div className="divide-y divide-slate-100">
              {otherLiabilities.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No other liabilities tracked.</div>
              ) : (
                otherLiabilities.map((acc) => {
                  const currentBalance = acc.history[acc.history.length - 1]?.balance || 0;
                  return (
                    <div key={acc.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                          {acc.type === 'mortgage' ? <Home className="h-5 w-5" /> : acc.type === 'loan' ? <Car className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{acc.name}</h4>
                          <span className="text-xs text-slate-500 capitalize">{acc.type.replace('_', ' ')} • {acc.interestRate}% APR</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">${currentBalance.toLocaleString()}</p>
                         <div className="flex items-center justify-end gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleDeleteAccount(acc.id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Modals */}
      <AddBalanceModal 
        isOpen={isUpdateModalOpen} 
        onClose={() => setIsUpdateModalOpen(false)} 
        accounts={accounts}
        onUpdate={handleAddBalance}
      />
      
      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={() => setIsAddAccountModalOpen(false)}
        onAdd={handleAddAccount}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        apiKey={apiKey}
        onSave={handleSaveApiKey}
        onReset={handleResetData}
      />

    </div>
  );
};

export default App;