import React, { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import { 
  Home, 
  PieChart, 
  Wallet, 
  Calendar, 
  History, 
  Plus, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Flame, 
  Settings, 
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  CheckCircle2,
  Tag,
  Gift,
  Utensils,
  ShoppingBag,
  Bus,
  Gamepad2,
  Heart,
  Grid,
  Briefcase,
  LogIn,
  LogOut,
  User,
  X,
  Loader2
} from 'lucide-react';
import Mascot from './components/Mascot';
import TransactionModal from './components/TransactionModal';
import PlansAndPaymentsSection from './components/PlansAndPaymentsSection';
import { AuthModal } from './components/AuthModal';
import { supabase } from './supabaseClient';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart as RePieChart, Pie, Cell } from 'recharts';

// Helper to fetch custom brand icon image
const getAccountLogo = (name = '', templateIdentifier = '') => {
  const n = (name + ' ' + templateIdentifier).toLowerCase();
  if (n.includes('gcash')) return '/icons/gcash.png';
  if (n.includes('maya')) return '/icons/maya.png';
  if (n.includes('maribank') || n.includes('mari')) return '/icons/maribank.png';
  if (n.includes('gotyme')) return '/icons/gotyme.png';
  if (n.includes('shopee') || n.includes('spaylater')) return '/icons/shopeepaylater.png';
  if (n.includes('lazada') || n.includes('lazpaylater') || n.includes('laz')) return '/icons/lazada.png';
  if (n.includes('bpi')) return '/icons/bpi.png';
  if (n.includes('bdo') || n.includes('bdopay')) return '/icons/bdopay.png';
  return null;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [showNetWorth, setShowNetWorth] = useState(true);
  const [accountFilter, setAccountFilter] = useState('all'); // all, assets, liabilities
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all'); // all, income, expense
  const [tempUserName, setTempUserName] = useState('');

  const { 
    user,
    setSession,
    loading,
    accounts, 
    transactions, 
    commitments, 
    netWorth, 
    recentIncome, 
    recentExpenses, 
    streakDays,
    streakCountCriteria,
    setStreakCountCriteria,
    userName,
    deleteTransaction,
    exportToCSV,
    addAccount,
    deleteAccount,
    addCommitment,
    autoProcessDailyInterest
  } = useStore();

  // Listen to Supabase Auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  // Sync tempUserName when settings modal opens
  useEffect(() => {
    if (isSettingsOpen) setTempUserName(userName || '');
  }, [isSettingsOpen, userName]);

  // Run automatic daily interest calculation silently on application launch
  useEffect(() => {
    autoProcessDailyInterest();
  }, []);

  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState('e-wallet');
  const [newAccBal, setNewAccBal] = useState('');
  const [newAccCreditLimit, setNewAccCreditLimit] = useState('');
  const [newAccSubtag, setNewAccSubtag] = useState('');
  const [newAccInterestRate, setNewAccInterestRate] = useState('');
  const [newAccInterestFreq, setNewAccInterestFreq] = useState('monthly');
  const [newAccTaxRate, setNewAccTaxRate] = useState('20');
  const [newAccMaintainingBal, setNewAccMaintainingBal] = useState('');

  const [newComTitle, setNewComTitle] = useState('');
  const [newComAmount, setNewComAmount] = useState('');
  const [newComType, setNewComType] = useState('installment');

  // Helper to compute periodic interest payout
  const computeInterestPayout = (acc) => {
    const bal = Number(acc.balance) || 0;
    const rate = Number(acc.annual_interest_rate) || 0;
    const taxRate = Number(acc.withholding_tax ?? 20) / 100;
    const freq = acc.interest_frequency || 'monthly';

    if (bal <= 0 || rate <= 0) return { gross: 0, tax: 0, net: 0, freqLabel: freq };

    let periodsPerYear = 12;
    if (freq === 'daily') periodsPerYear = 365;
    else if (freq === 'quarterly') periodsPerYear = 4;
    else if (freq === 'yearly') periodsPerYear = 1;

    const grossPeriodInterest = (bal * (rate / 100)) / periodsPerYear;
    const taxAmount = grossPeriodInterest * taxRate;
    const netPeriodInterest = grossPeriodInterest - taxAmount;

    return {
      gross: grossPeriodInterest,
      tax: taxAmount,
      net: netPeriodInterest,
      freqLabel: freq
    };
  };

  // Group transactions by date for History timeline view (Today, Yesterday, etc.)
  const groupTransactionsByDate = (txList) => {
    const groups = {};
    txList.forEach((tx) => {
      const dateObj = new Date(tx.transaction_date);
      const dateKey = dateObj.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateLabel: isToday(dateObj) ? 'Today' : (isYesterday(dateObj) ? 'Yesterday' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })),
          dateString: dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          items: [],
          totalIncome: 0,
          totalExpense: 0,
        };
      }
      groups[dateKey].items.push(tx);
      if (tx.type === 'income') groups[dateKey].totalIncome += Number(tx.amount);
      else groups[dateKey].totalExpense += Number(tx.amount);
    });
    return Object.values(groups);
  };

  const isToday = (someDate) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear();
  };

  const isYesterday = (someDate) => {
    const yesterday = new Date(Date.now() - 86400000);
    return someDate.getDate() === yesterday.getDate() &&
      someDate.getMonth() === yesterday.getMonth() &&
      someDate.getFullYear() === yesterday.getFullYear();
  };

  const filteredHistory = transactions.filter((t) => {
    const matchesSearch = (t.notes || t.category_name || '').toLowerCase().includes(historySearch.toLowerCase());
    const matchesType = historyTypeFilter === 'all' || t.type === historyTypeFilter;
    return matchesSearch && matchesType;
  });

  const groupedHistory = groupTransactionsByDate(filteredHistory);

  const filteredAccounts = accounts.filter((acc) => {
    if (accountFilter === 'assets') return acc.type !== 'credit' && acc.type !== 'pay_later';
    if (accountFilter === 'liabilities') return acc.type === 'credit' || acc.type === 'pay_later';
    return true;
  });

  const handleAddAccountSubmit = (e) => {
    e.preventDefault();
    if (!newAccName) return;

    let subtextStr = '';
    const balVal = Number(newAccBal) || 0;

    if (newAccType === 'e-wallet') {
      subtextStr = newAccSubtag ? `E-Wallet • ${newAccSubtag}` : 'E-Wallet';
    } else if (newAccType === 'debit') {
      subtextStr = newAccInterestRate ? `Debit • ${newAccInterestRate}% P.A.` : 'Bank Account';
    } else if (newAccType === 'credit') {
      subtextStr = newAccCreditLimit ? `Credit Card • Limit ₱${Number(newAccCreditLimit).toLocaleString()}` : 'Credit Card';
    } else if (newAccType === 'pay_later') {
      subtextStr = newAccCreditLimit ? `Pay Later • Limit ₱${Number(newAccCreditLimit).toLocaleString()}` : 'Pay Later Liability';
    }

    addAccount({
      name: newAccName,
      type: newAccType,
      balance: balVal,
      annual_interest_rate: newAccInterestRate ? Number(newAccInterestRate) : 0,
      interest_frequency: newAccInterestFreq,
      withholding_tax: newAccTaxRate ? Number(newAccTaxRate) : 20,
      maintaining_balance: newAccMaintainingBal ? Number(newAccMaintainingBal) : 0,
      subtext: subtextStr,
    });

    setNewAccName('');
    setNewAccBal('');
    setNewAccCreditLimit('');
    setNewAccSubtag('');
    setNewAccInterestRate('');
    setNewAccMaintainingBal('');
  };

  const handleAddCommitmentSubmit = (e) => {
    e.preventDefault();
    if (!newComTitle || !newComAmount) return;
    addCommitment({
      title: newComTitle,
      type: newComType,
      total_amount: Number(newComAmount),
      remaining_balance: Number(newComAmount),
      due_date: new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10),
      vendor: newComTitle
    });
    setNewComTitle('');
    setNewComAmount('');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F3F4F6] text-[#1F2937] font-sans antialiased">
      {/* Sidebar Navigation - Fixed/Sticky on Desktop */}
      <nav className="bg-[#FFF2B2] w-full md:w-80 p-5 md:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-yellow-200/80 md:sticky md:top-0 md:h-screen flex-shrink-0 z-20">
        <div className="space-y-6">
          {/* Web App Header & Mascot Branding */}
          <div className="flex items-center gap-3.5 bg-white p-3 rounded-2xl border-2 border-gray-900 shadow-xs">
            <div className="w-14 h-14 rounded-xl bg-[#FFF2B2] flex items-center justify-center border border-yellow-300 p-1 overflow-hidden flex-shrink-0">
              <img src="/pochinko.png" alt="Pochinko Logo" className="w-full h-full object-contain transform scale-110" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-gray-900 leading-none">Pochinko</h1>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-900 block mt-1">
                Web Finance Suite
              </span>
            </div>
          </div>

          {/* Desktop Log Entry Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="hidden md:flex w-full items-center justify-center gap-2.5 bg-[#FFF2B2] hover:bg-[#FFE885] text-amber-950 font-black py-3.5 px-4 rounded-2xl border border-yellow-400 shadow-xs transition-all duration-200 cursor-pointer text-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} className="stroke-[3] text-amber-950" />
            <span>Log New Entry</span>
          </button>

          {/* Navigation Links (Desktop Sidebar Only - Hidden on Mobile) */}
          <ul className="hidden md:flex flex-col gap-2 w-full justify-start">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'history', label: 'Timeline History', icon: History },
              { id: 'accounts', label: 'Accounts & Wallets', icon: Wallet },
              { id: 'analytics', label: 'Statistics & Reports', icon: PieChart },
              { id: 'goals', label: 'Plans & Payments', icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3.5 rounded-2xl font-black text-xs lg:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap hover:scale-[1.02] active:scale-[0.97] ${
                      active
                        ? 'bg-white text-gray-900 shadow-xs border border-yellow-300 scale-100'
                        : 'text-gray-800 hover:bg-yellow-200/70'
                    }`}
                  >
                    <Icon size={18} className={`flex-shrink-0 ${active ? 'text-amber-600' : 'text-gray-700'}`} />
                    <span>{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sidebar Footer Export Button */}
        <div className="hidden md:block pt-6 border-t border-yellow-300 mt-auto">
          <button
            onClick={exportToCSV}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-yellow-100 text-gray-900 font-extrabold py-3 px-4 rounded-2xl border-2 border-gray-900 shadow-xs transition-all text-xs cursor-pointer active:translate-y-0.5"
          >
            <Download size={16} /> Export Financial CSV
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Header Row with Clickable Streak & Settings */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-xs font-black tracking-wider uppercase text-gray-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              
              {/* Clickable Streak Pill */}
              <button
                onClick={() => setIsStreakModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#FFF2B2] hover:bg-amber-300 border-2 border-gray-900 text-gray-900 text-xs font-black px-3.5 py-1.5 rounded-full shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-all"
                title="Click to view streak breakdown"
              >
                <Flame size={15} className="fill-amber-500 text-amber-600 animate-bounce" />
                <span>x{streakDays} day streak!</span>
              </button>

              {/* Top Settings Icon Button (Cleanly placed beside streak) */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 bg-[#FFF2B2] hover:bg-amber-300 border-2 border-gray-900 text-gray-900 rounded-full shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-all"
                title="Open Settings"
              >
                <Settings size={15} />
              </button>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mt-1">
              Good evening, <span className="text-amber-600">{userName}</span>!
            </h2>
          </div>

          {/* Auth Session User Account Pill / Sign In Button */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border-2 border-gray-900 shadow-xs">
                <User size={16} className="text-emerald-600" />
                <span className="text-xs font-black text-gray-900 max-w-[140px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#FFF2B2] hover:bg-[#FFE885] text-amber-950 text-xs font-black px-4 py-2 rounded-2xl border border-yellow-400 shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                <LogIn size={15} className="text-amber-950" />
                <span>Sign In / Sync</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Mascot Speech Bubble Card */}
            <Mascot recentExpenses={recentExpenses} recentIncome={recentIncome} netWorth={netWorth} userName={userName} />

            {/* Quick Metrics Bar: Today's Activity & Accounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-500">Today Summary</span>
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    <span className="text-[11px] font-black bg-white text-gray-900 px-2.5 py-0.5 rounded-lg shadow-2xs">Day</span>
                    <span className="text-[11px] font-bold text-gray-500 px-2 py-0.5">Week</span>
                    <span className="text-[11px] font-bold text-gray-500 px-2 py-0.5">Month</span>
                  </div>
                </div>

                <div className="space-y-3 my-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                      <TrendingUp size={16} /> Income
                    </span>
                    <span className="text-lg font-black text-emerald-600">₱{recentIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-rose-600 flex items-center gap-1.5">
                      <TrendingDown size={16} /> Spent
                    </span>
                    <span className="text-lg font-black text-rose-600">₱{recentExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Worth Quick Metric - Soft Warm Pochinko Palette */}
              <div className="bg-[#FFF8E7] text-gray-900 p-6 rounded-3xl border border-amber-300/80 shadow-xs flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-900 tracking-wider">Total Net Worth</span>
                  <button onClick={() => setShowNetWorth(!showNetWorth)} className="text-amber-800 hover:text-amber-950 cursor-pointer p-1">
                    {showNetWorth ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="text-3xl font-black tracking-tight my-2 text-gray-900">
                  {showNetWorth ? `₱${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••••'}
                </div>
                <span className="text-xs text-amber-900/70 font-bold">Calculated real-time from assets minus liabilities</span>
              </div>
            </div>

            {/* Upcoming / Payments Due Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-amber-100 text-amber-900 rounded-2xl font-black">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base">Upcoming Income</h3>
                    <p className="text-xs text-gray-500 font-medium">Planned and recurring income</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {commitments.filter(c => c.type === 'owed_to_me').map((c) => (
                    <div key={c.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-200">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{c.title}</div>
                        <span className="text-xs text-rose-500 font-semibold">{c.status || 'Pending'}</span>
                      </div>
                      <span className="text-base font-black text-emerald-600">₱{Number(c.total_amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-gray-900 text-base">Payments Due</h3>
                    <p className="text-xs text-gray-500 font-medium">Upcoming bills & installments</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-gray-400 block">Total Due</span>
                    <span className="text-sm font-black text-rose-600">₱40.75</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {commitments.filter(c => c.type !== 'owed_to_me').map((c) => (
                    <div key={c.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 font-black flex items-center justify-center text-xs">
                          S
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{c.title}</div>
                          <span className="text-xs text-gray-500 font-semibold">{c.status || 'Due Soon'}</span>
                        </div>
                      </div>
                      <span className="text-base font-black text-rose-600">₱{Number(c.remaining_balance).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TIMELINE HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Search & Filters Header Bar */}
            <div className="bg-white p-4 rounded-3xl border-2 border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-200 w-full sm:w-80">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search note or category..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex bg-gray-100 p-1 rounded-2xl">
                  {['all', 'income', 'expense'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setHistoryTypeFilter(t)}
                      className={`px-4 py-1.5 text-xs font-extrabold rounded-xl capitalize transition-all cursor-pointer ${
                        historyTypeFilter === t ? 'bg-[#1F2937] text-white shadow-2xs' : 'text-gray-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline Grouped View */}
            <div className="space-y-6">
              {groupedHistory.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border-2 border-gray-200 text-center font-bold text-gray-400 text-sm">
                  No transaction history records found matching filter.
                </div>
              ) : (
                groupedHistory.map((group, gIdx) => (
                  <div key={gIdx} className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-xs space-y-4">
                    {/* Day Group Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <h4 className="font-black text-gray-900 text-base">{group.dateLabel}</h4>
                        <span className="text-xs text-gray-400 font-semibold uppercase">{group.dateString}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-black">
                        {group.totalExpense > 0 && (
                          <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full border border-rose-200">
                            -₱{group.totalExpense.toFixed(2)}
                          </span>
                        )}
                        {group.totalIncome > 0 && (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">
                            +₱{group.totalIncome.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Transactions under day */}
                    <div className="divide-y divide-gray-100">
                      {group.items.map((tx) => (
                        <div key={tx.id} className="py-3.5 flex items-center justify-between hover:bg-gray-50/80 px-2 rounded-2xl transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-2xl border ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                              {tx.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                            </div>
                            <div>
                              <div className="font-black text-sm text-gray-900">{tx.category_name || 'General'}</div>
                              <div className="text-xs text-gray-500 font-semibold">
                                {tx.notes ? tx.notes : 'No description note'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className={`font-black text-base ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {tx.type === 'income' ? '+' : '-'}₱{Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <button
                              onClick={() => deleteTransaction(tx.id)}
                              className="text-gray-300 hover:text-rose-600 transition-colors p-1.5 cursor-pointer"
                              title="Delete entry"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ACCOUNTS & WALLETS */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-[#FFF2B2] border-2 border-gray-900 p-2 flex items-center justify-center shadow-xs">
                  <img src="/pochinko.png" alt="Mascot" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-gray-500">NET WORTH</span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2.5 py-0.5 rounded-full">
                      {netWorth < 0 ? 'Negative Trend' : 'Positive Trend'}
                    </span>
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-gray-900 mt-1 flex items-center gap-3">
                    {showNetWorth ? `₱${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••••'}
                  </div>
                  <span className="text-xs text-gray-500 font-semibold">Assets minus liabilities</span>
                </div>
              </div>

              <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                {['all', 'assets', 'liabilities'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setAccountFilter(f)}
                    className={`px-5 py-2 text-xs font-black rounded-xl capitalize cursor-pointer transition-all ${
                      accountFilter === f ? 'bg-[#FFF2B2] text-amber-950 border border-yellow-400 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAccounts.length === 0 ? (
                <div className="col-span-full bg-white p-8 rounded-3xl border-2 border-gray-200 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-yellow-100 border border-yellow-300 flex items-center justify-center mx-auto text-amber-900 font-black">
                    <Wallet size={28} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900">No accounts created yet</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto font-medium">
                    Click a preset template below or fill out the form to add your GCash, Maya, Bank account, or credit card!
                  </p>
                </div>
              ) : (
                filteredAccounts.map((acc) => {
                  const isInterestActive = Number(acc.annual_interest_rate) > 0;
                  const maintainingBal = Number(acc.maintaining_balance) || 0;
                  const isBelowMaintaining = maintainingBal > 0 && Number(acc.balance) < maintainingBal;

                  return (
                    <div key={acc.id} className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-xs hover:border-gray-900 transition-all flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-black text-gray-900 text-lg">{acc.name}</h4>
                            <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded-md inline-block mt-1">
                              {acc.subtext || acc.type}
                            </span>
                          </div>
                          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-gray-900 font-black border border-gray-200 overflow-hidden shrink-0 p-0.5 shadow-2xs">
                            {getAccountLogo(acc.name, acc.template_identifier) ? (
                              <img src={getAccountLogo(acc.name, acc.template_identifier)} alt={acc.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <span>{(acc.name || 'Account')[0]}</span>
                            )}
                          </div>
                        </div>

                        {/* Passive Auto Interest Info */}
                        {isInterestActive && (
                          <div className="mt-3 p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-black text-emerald-950 flex items-center gap-1">
                                <TrendingUp size={14} className="text-emerald-600" /> Daily Interest (Auto-Yield)
                              </span>
                              <span className="font-mono font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md text-[10px]">
                                {acc.annual_interest_rate}% P.A.
                              </span>
                            </div>

                            <div className="text-[11px] font-semibold text-emerald-900 pt-1 flex justify-between">
                              <span>Auto-credited net yield:</span>
                              <span className="font-black text-emerald-700">
                                +₱{((Number(acc.balance) * (Number(acc.annual_interest_rate)/100) * 0.8) / 365).toFixed(2)}/day
                              </span>
                            </div>
                          </div>
                        )}

                        {maintainingBal > 0 && (
                          <div className={`mt-2 p-2.5 rounded-xl border text-xs font-bold ${
                            isBelowMaintaining ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-gray-50 border-gray-200 text-gray-700'
                          }`}>
                            <div className="flex justify-between items-center">
                              <span>Maintaining Balance:</span>
                              <span>₱{maintainingBal.toLocaleString()}</span>
                            </div>
                            {isBelowMaintaining && (
                              <span className="text-[10px] text-rose-600 font-extrabold block mt-0.5">
                                ⚠️ Below required balance! Fee risk.
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                        <div>
                          <span className="text-[10px] font-black uppercase text-gray-400 block">BALANCE</span>
                          <span className={`text-2xl font-black ${acc.type === 'credit' || acc.type === 'pay_later' ? 'text-rose-600' : 'text-emerald-600'}`}>
                            ₱{Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteAccount(acc.id)}
                          className="text-gray-300 hover:text-rose-600 transition-colors p-1.5 cursor-pointer"
                          title="Delete account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Account Section with Bank / E-Wallet Presets */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-gray-200 shadow-xs max-w-2xl">
              <h3 className="font-black text-gray-900 text-lg mb-1">Add Account / Wallet</h3>
              <p className="text-xs text-gray-500 font-semibold mb-6">Choose a Bank, E-Wallet, or Pay Later template to auto-fill</p>

              {/* Bank & E-Wallet Preset Templates */}
              <div className="mb-6 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">
                    QUICK ACCOUNT TEMPLATES
                  </label>
                  <span className="text-[10px] font-bold text-gray-400">Click to auto-fill</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { name: 'GCash', type: 'e-wallet', rate: '', subtext: 'E-Wallet', color: 'bg-blue-600 text-white', badge: 'Popular' },
                    { name: 'Maya', type: 'e-wallet', rate: '3.5', subtext: 'E-Wallet • 3.5% P.A.', color: 'bg-emerald-600 text-white', badge: 'Yield' },
                    { name: 'MariBank', type: 'debit', rate: '3.75', subtext: 'Digital Bank • 3.75% P.A.', color: 'bg-amber-500 text-white', badge: 'Daily Yield' },
                    { name: 'GoTyme', type: 'debit', rate: '4.0', subtext: 'Digital Bank • 4.0% P.A.', color: 'bg-cyan-600 text-white', badge: 'High Yield' },
                    { name: 'ShopeePayLater', type: 'pay_later', rate: '', subtext: 'Pay Later Liability', color: 'bg-orange-600 text-white', badge: 'Pay Later' },
                    { name: 'LazPayLater', type: 'pay_later', rate: '', subtext: 'Lazada Pay Later', color: 'bg-indigo-600 text-white', badge: 'Pay Later' },
                    { name: 'BPI', type: 'debit', rate: '0.0625', subtext: 'Traditional Bank', color: 'bg-red-700 text-white' },
                    { name: 'BDO Pay', type: 'debit', rate: '0.0625', subtext: 'Digital Wallet / Bank', color: 'bg-blue-900 text-white' },
                  ].map((tpl, i) => {
                    const isSelected = newAccName === tpl.name;
                    const logo = getAccountLogo(tpl.name);

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setNewAccName(tpl.name);
                          setNewAccType(tpl.type);
                          if (tpl.rate) setNewAccInterestRate(tpl.rate);
                        }}
                        className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#FFF2B2] border-gray-900 shadow-xs'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-400 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                            {logo ? (
                              <img src={logo} alt={tpl.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <span className="text-gray-900 font-black">{tpl.name[0]}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-black text-gray-900 leading-tight whitespace-nowrap overflow-visible">
                              {tpl.name}
                            </h5>
                            <span className="text-[10px] text-gray-500 font-semibold block mt-0.5 truncate">
                              {tpl.subtext}
                            </span>
                          </div>
                        </div>

                        {tpl.badge && (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                            tpl.type === 'pay_later' ? 'bg-orange-100 text-orange-950 border border-orange-200' : 'bg-emerald-100 text-emerald-950 border border-emerald-200'
                          }`}>
                            {tpl.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleAddAccountSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Account Type</label>
                    <select
                      value={newAccType}
                      onChange={(e) => setNewAccType(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:border-amber-400 focus:outline-none"
                    >
                      <option value="e-wallet">E-Wallet (GCash, Maya, etc.)</option>
                      <option value="debit">Bank / Debit (MariBank, BPI, etc.)</option>
                      <option value="credit">Credit Card</option>
                      <option value="pay_later">Pay Later (ShopeePayLater, LazPayLater)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {newAccType === 'pay_later' ? 'Service Name' : 'Account Name'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        newAccType === 'e-wallet'
                          ? 'e.g. GCash Personal'
                          : newAccType === 'debit'
                          ? 'e.g. BPI Savings'
                          : newAccType === 'credit'
                          ? 'e.g. Citi Rewards Card'
                          : 'e.g. ShopeePayLater'
                      }
                      value={newAccName}
                      onChange={(e) => setNewAccName(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Dynamic Fields for E-Wallet */}
                {newAccType === 'e-wallet' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Initial Balance (₱)</label>
                      <input
                        type="number"
                        required
                        placeholder="0.00"
                        value={newAccBal}
                        onChange={(e) => setNewAccBal(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Mobile / Account Tag (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 0917-XXX-XXXX"
                        value={newAccSubtag}
                        onChange={(e) => setNewAccSubtag(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-900 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Dynamic Fields for Bank / Debit */}
                {newAccType === 'debit' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Initial Balance (₱)</label>
                      <input
                        type="number"
                        required
                        placeholder="0.00"
                        value={newAccBal}
                        onChange={(e) => setNewAccBal(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div className="p-4 bg-yellow-50/70 rounded-2xl border border-yellow-200 space-y-3">
                      <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-amber-600" /> Bank Interest & Maintaining Balance Rules (Optional)
                      </span>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-700 mb-1">Annual Interest Rate (% P.A.)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 3.75 or 4.0"
                            value={newAccInterestRate}
                            onChange={(e) => setNewAccInterestRate(e.target.value)}
                            className="w-full p-2.5 bg-white border border-yellow-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-700 mb-1">Interest Frequency</label>
                          <select
                            value={newAccInterestFreq}
                            onChange={(e) => setNewAccInterestFreq(e.target.value)}
                            className="w-full p-2.5 bg-white border border-yellow-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                          >
                            <option value="daily">Daily Credit</option>
                            <option value="monthly">Monthly Payout</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-700 mb-1">Withholding Tax Rate (%)</label>
                          <input
                            type="number"
                            placeholder="20"
                            value={newAccTaxRate}
                            onChange={(e) => setNewAccTaxRate(e.target.value)}
                            className="w-full p-2.5 bg-white border border-yellow-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-700 mb-1">Maintaining Balance (₱)</label>
                          <input
                            type="number"
                            placeholder="e.g. 2000"
                            value={newAccMaintainingBal}
                            onChange={(e) => setNewAccMaintainingBal(e.target.value)}
                            className="w-full p-2.5 bg-white border border-yellow-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Dynamic Fields for Credit Card / Pay Later */}
                {(newAccType === 'credit' || newAccType === 'pay_later') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Credit Limit (₱)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={newAccCreditLimit}
                        onChange={(e) => setNewAccCreditLimit(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Current Balance Due (₱)</label>
                      <input
                        type="number"
                        required
                        placeholder="0.00"
                        value={newAccBal}
                        onChange={(e) => setNewAccBal(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#FFF2B2] hover:bg-amber-300 border border-yellow-400 font-black text-gray-900 rounded-2xl text-xs cursor-pointer transition-all shadow-xs active:scale-[0.98]"
                >
                  Save Account
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: STATISTICS & ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Top Stat Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border-2 border-gray-200 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block mb-1">SPENT</span>
                <div className="text-2xl font-black text-gray-900">₱{(recentExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="bg-white p-5 rounded-3xl border-2 border-gray-200 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-1">INCOME</span>
                <div className="text-2xl font-black text-gray-900">₱{(recentIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="bg-white p-5 rounded-3xl border-2 border-gray-200 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-1">NET FLOW</span>
                <div className={`text-2xl font-black ${(recentIncome - recentExpenses) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ₱{(recentIncome - recentExpenses).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-white p-5 rounded-3xl border-2 border-gray-200 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 block mb-1">TRANSACTIONS</span>
                <div className="text-2xl font-black text-gray-900">{transactions.length} Total</div>
              </div>
            </div>

            {/* Visual Charts Grid: Net Worth Trend & Monthly Activity */}
            {transactions.length === 0 ? (
              <div className="bg-white p-10 md:p-14 rounded-3xl border border-gray-200/80 shadow-xs text-center space-y-4 max-w-lg mx-auto my-6">
                <div className="w-16 h-16 rounded-2xl bg-[#FFF2B2] border border-yellow-300 text-amber-900 flex items-center justify-center mx-auto text-2xl font-black shadow-2xs">
                  📊
                </div>
                <h3 className="text-xl font-black text-gray-900">No Analytics Data Yet</h3>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                  Log your income, expenses, or transfers using the <strong>+ Log New Entry</strong> button to start generating real-time spending breakdowns and cashflow charts!
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#FFF2B2] hover:bg-amber-300 border border-yellow-400 font-black text-gray-900 px-6 py-3 rounded-2xl text-xs cursor-pointer shadow-xs transition-all active:scale-95"
                >
                  + Log First Entry
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Cashflow Trend Area Chart */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-black text-gray-900 text-base">Net Worth & Cashflow Trend</h3>
                        <p className="text-xs text-gray-500 font-medium">Income vs Expenses cashflow over time</p>
                      </div>
                      <span className="text-xs font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-yellow-300">
                        Recorded Activity
                      </span>
                    </div>
                    <div className="h-64 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { month: 'Total', income: recentIncome, expense: recentExpenses },
                        ]}>
                          <XAxis dataKey="month" stroke="#6B7280" fontSize={12} tickLine={false} />
                          <YAxis stroke="#6B7280" fontSize={12} tickLine={false} />
                          <Tooltip />
                          <Area type="monotone" dataKey="income" stroke="#10B981" fill="#D1FAE5" strokeWidth={3} name="Income" />
                          <Area type="monotone" dataKey="expense" stroke="#EF4444" fill="#FEE2E2" strokeWidth={3} name="Expense" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Monthly Activity Vertical Visual Bars */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                    <div className="mb-2">
                      <h3 className="font-black text-gray-900 text-base">Monthly Activity Breakdown</h3>
                      <p className="text-xs text-gray-500 font-medium">Recorded cashflow volume by month</p>
                    </div>

                    <div className="space-y-4 my-2">
                      <div className="space-y-1.5 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                        <div className="flex justify-between items-center text-xs font-black text-gray-900">
                          <span>Current Period</span>
                          <span className="text-gray-500 font-semibold">
                            Income ₱{recentIncome.toFixed(0)} • Spent ₱{recentExpenses.toFixed(0)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden flex gap-1">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${recentIncome + recentExpenses > 0 ? (recentIncome / (recentIncome + recentExpenses)) * 100 : 0}%` }}></div>
                          <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${recentIncome + recentExpenses > 0 ? (recentExpenses / (recentIncome + recentExpenses)) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400 block text-center">Green = Income • Red = Expenses</span>
                  </div>
                </div>

                {/* Visual Charts Grid 2: Interactive Donut Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Expense Donut Chart Visual */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
                    <h3 className="font-black text-gray-900 text-base mb-1">Expense Distribution Donut</h3>
                    <p className="text-xs text-gray-500 font-medium mb-4">How your spending splits across categories</p>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-48 h-48 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={[
                                { name: 'Expense Total', value: recentExpenses || 1, color: '#EF4444' },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={75}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              <Cell fill="#EF4444" />
                            </Pie>
                            <Tooltip />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-2.5 flex-1 w-full">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                            <span className="font-bold text-gray-900">Total Spent</span>
                          </div>
                          <span className="font-black text-rose-600">₱{recentExpenses.toLocaleString()} (100%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Income Donut Chart Visual */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
                    <h3 className="font-black text-gray-900 text-base mb-1">Income Distribution Donut</h3>
                    <p className="text-xs text-gray-500 font-medium mb-4">How your income splits across sources</p>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-48 h-48 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={[
                                { name: 'Income Total', value: recentIncome || 1 },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={75}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              <Cell fill="#10B981" />
                            </Pie>
                            <Tooltip />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-3 flex-1 w-full">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                            <span className="font-bold text-gray-900">Total Earnings</span>
                          </div>
                          <span className="font-black text-emerald-600">₱{recentIncome.toLocaleString()} (100%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 5: PLANS & PAYMENTS */}
        {activeTab === 'goals' && (
          <PlansAndPaymentsSection />
        )}
      </main>

      {/* Floating Island Bottom Navigation & Floating + Action Button */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 flex items-center gap-3 max-w-md mx-auto">
        {/* Detached Floating Island Navigation Bar with rounded-3xl corners & shadow */}
        <div className="flex-1 bg-[#FFF2B2] border-2 border-gray-900 rounded-3xl p-2 flex items-center justify-around shadow-2xl backdrop-blur-md">
          {[
            { id: 'dashboard', label: 'Home', icon: Home },
            { id: 'history', label: 'History', icon: History },
            { id: 'accounts', label: 'Accounts', icon: Wallet },
            { id: 'analytics', label: 'Analytics', icon: PieChart },
            { id: 'goals', label: 'Plans', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-[#1F2937] text-[#FFF2B2] w-11 h-11 rounded-2xl shadow-md scale-105 border border-gray-900' 
                    : 'text-[#1F2937]/70 hover:text-[#1F2937] w-9 h-9'
                }`}
                title={tab.label}
              >
                <Icon size={isActive ? 20 : 18} className={isActive ? 'text-[#FFF2B2]' : 'text-gray-900'} />
              </button>
            );
          })}
        </div>

        {/* Floating Detached Action Button (+) with rounded-full circular shape & shadow */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 rounded-full bg-[#1F2937] hover:bg-gray-800 text-[#FFF2B2] border-2 border-gray-900 shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all flex-shrink-0"
          title="Log New Entry"
        >
          <Plus size={30} className="stroke-[3] text-[#FFF2B2]" />
        </button>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md border-2 border-gray-900 shadow-2xl text-gray-900">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-amber-600" />
                <h3 className="text-lg font-black text-gray-900">App Preferences & Rules</h3>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Username Settings Section */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80">
                <label className="block text-xs font-black uppercase text-gray-700 mb-1">
                  👤 Display Name / Username
                </label>
                <p className="text-xs text-gray-500 font-semibold mb-3">
                  This is how Pochinko greets you on your dashboard:
                </p>
                <input
                  type="text"
                  value={tempUserName}
                  onChange={(e) => setTempUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Daily Streak Calculation Criteria Option */}
              <div className="p-4 bg-[#FFF2B2]/60 rounded-2xl border border-yellow-300">
                <label className="block text-xs font-black uppercase text-amber-950 mb-1">
                  🔥 Daily Streak Calculation Rule
                </label>
                <p className="text-xs text-gray-600 font-semibold mb-3">
                  Choose which transactions qualify to maintain your daily streak count:
                </p>

                <div className="space-y-2">
                  {[
                    { id: 'either', label: 'Either (Income OR Expense)', desc: 'Any transaction logged daily maintains your streak' },
                    { id: 'expense', label: 'Expenses Only', desc: 'Only daily expenses count toward maintaining your streak' },
                    { id: 'income', label: 'Income Only', desc: 'Only daily earnings count toward maintaining your streak' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setStreakCountCriteria(option.id)}
                      className={`w-full text-left p-3 rounded-xl border font-bold transition-all cursor-pointer ${
                        streakCountCriteria === option.id
                          ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                          : 'bg-white text-gray-800 border-yellow-300 hover:bg-yellow-100'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-black">
                        <span>{option.label}</span>
                        {streakCountCriteria === option.id && <CheckCircle2 size={14} className="text-amber-300" />}
                      </div>
                      <span className={`text-[10px] block mt-0.5 font-medium ${streakCountCriteria === option.id ? 'text-gray-300' : 'text-gray-500'}`}>
                        {option.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Save & Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (tempUserName && tempUserName.trim()) {
                    setUserName(tempUserName.trim());
                  }
                  setIsSettingsOpen(false);
                }}
                className="w-full py-3.5 bg-[#FFF2B2] hover:bg-amber-300 border border-yellow-400 font-black text-xs text-gray-900 rounded-2xl shadow-xs cursor-pointer active:scale-[0.98] transition-all"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streak Info Modal */}
      {isStreakModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md border-2 border-gray-900 shadow-2xl text-gray-900">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Flame size={24} className="fill-amber-500 text-amber-600 animate-bounce" />
                <h3 className="text-xl font-black text-gray-900">x{streakDays} Day Streak!</h3>
              </div>
              <button onClick={() => setIsStreakModalOpen(false)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-gray-700">
              <div className="p-4 bg-[#FFF2B2] rounded-2xl border border-yellow-300">
                <span className="text-xs font-black uppercase text-amber-950 block mb-1">Current Rule</span>
                <p className="text-gray-900 font-bold">
                  Counting transactions where type matches: <span className="uppercase text-amber-700 font-black">[{streakCountCriteria}]</span>
                </p>
              </div>

              <p>
                Keep logging your daily activity to maintain your momentum and unlock streak achievements!
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsStreakModalOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 font-black text-gray-800 rounded-2xl cursor-pointer"
                >
                  Change Streak Rule
                </button>
                <button
                  onClick={() => setIsStreakModalOpen(false)}
                  className="flex-1 py-3 bg-[#FFF2B2] hover:bg-amber-300 border-2 border-gray-900 font-black text-gray-900 rounded-2xl cursor-pointer"
                >
                  Awesome!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
