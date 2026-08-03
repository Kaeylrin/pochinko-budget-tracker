import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  PlusCircle, 
  X, 
  Tag, 
  Calendar, 
  Clock, 
  Repeat, 
  Briefcase, 
  Gift, 
  DollarSign, 
  TrendingUp, 
  Zap, 
  Utensils, 
  ShoppingBag, 
  Gamepad2, 
  Bus, 
  Grid, 
  CreditCard, 
  Heart, 
  Smartphone,
  Layout,
  Plus,
  BookOpen,
  Coffee,
  Plane,
  Home as HomeIcon,
  Shield,
  Layers
} from 'lucide-react';

export default function TransactionModal({ isOpen, onClose }) {
  const { accounts, categories, addTransaction } = useStore();
  const [type, setType] = useState('expense');
  const [selectedCategory, setSelectedCategory] = useState('c4'); // Food default
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || '1');
  const [notes, setNotes] = useState('');
  const [loggedDate, setLoggedDate] = useState('2026-08-02');
  const [loggedTime, setLoggedTime] = useState('21:24');

  // Advanced Recurring Settings
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('monthly');
  const [stopCondition, setStopCondition] = useState('never');
  const [stopDate, setStopDate] = useState('2026-12-31');
  const [stopCount, setStopCount] = useState('12');

  // Template Quick Picker State
  const [activeTemplate, setActiveTemplate] = useState(null);

  // Custom Category Modal State
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [customCatName, setCustomCatName] = useState('');
  const [selectedIconId, setSelectedIconId] = useState('Utensils');
  const [selectedCatColor, setSelectedCatColor] = useState('text-amber-500 bg-amber-50');
  const [customHexColor, setCustomHexColor] = useState('#508A59');
  const [colorMode, setColorMode] = useState('hex'); // 'hex' | 'rgb'
  const [rgbR, setRgbR] = useState(80);
  const [rgbG, setRgbG] = useState(138);
  const [rgbB, setRgbB] = useState(89);

  // Sync RGB to Hex
  const handleRgbChange = (r, g, b) => {
    setRgbR(r);
    setRgbG(g);
    setRgbB(b);
    const toHex = (c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0');
    setCustomHexColor(`#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase());
  };

  // Global Escape key listener for closing modals
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showAddCategoryModal) setShowAddCategoryModal(false);
        else if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showAddCategoryModal, onClose]);

  if (!isOpen) return null;

  // Preset Templates with Lucide Icons
  const presetTemplates = [
    { id: 't_grocery', name: 'Weekly Groceries', amount: '1500', type: 'expense', categoryId: 'c4', note: 'SM Supermarket Groceries', icon: Utensils },
    { id: 't_salary', name: 'Bi-Monthly Salary', amount: '35000', type: 'income', categoryId: 'c8', note: 'Company Salary Direct Deposit', icon: DollarSign },
    { id: 't_coffee', name: 'Daily Coffee', amount: '180', type: 'expense', categoryId: 'c4', note: 'Morning Coffee', icon: Coffee },
    { id: 't_rent', name: 'Apartment Rent', amount: '12000', type: 'expense', categoryId: 'c7', note: 'Monthly House Rent', icon: HomeIcon },
  ];

  const incomeCategoryButtons = [
    { id: 'c1', name: 'Gift / Allowance', icon: Gift, color: 'text-pink-500 bg-pink-50' },
    { id: 'c2', name: 'Freelance', icon: Briefcase, color: 'text-amber-500 bg-amber-50' },
    { id: 'c8', name: 'Salary', icon: DollarSign, color: 'text-emerald-500 bg-emerald-50' },
    { id: 'c9', name: 'Side Hustle', icon: Zap, color: 'text-yellow-600 bg-yellow-50' },
    { id: 'c10', name: 'Interest', icon: TrendingUp, color: 'text-teal-500 bg-teal-50' },
    { id: 'c7', name: 'Other', icon: Grid, color: 'text-gray-500 bg-gray-50' },
  ];

  const expenseCategoryButtons = [
    { id: 'c3', name: 'Fees & Subscriptions', icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
    { id: 'c4', name: 'Food & Dining', icon: Utensils, color: 'text-orange-500 bg-orange-50' },
    { id: 'c6', name: 'Transport & Commute', icon: Bus, color: 'text-blue-500 bg-blue-50' },
    { id: 'c11', name: 'Phone & Internet', icon: Smartphone, color: 'text-purple-500 bg-purple-50' },
    { id: 'c12', name: 'Shopping & Clothes', icon: ShoppingBag, color: 'text-pink-500 bg-pink-50' },
    { id: 'c5', name: 'Fun & Gaming', icon: Gamepad2, color: 'text-emerald-500 bg-emerald-50' },
    { id: 'c13', name: 'Health & Medical', icon: Heart, color: 'text-rose-500 bg-rose-50' },
    { id: 'c7', name: 'Other Expenses', icon: Grid, color: 'text-gray-500 bg-gray-50' },
  ];

  const activeCategoryList = type === 'income' ? incomeCategoryButtons : expenseCategoryButtons;

  const handleApplyTemplate = (tmpl) => {
    setActiveTemplate(tmpl.id);
    setType(tmpl.type);
    setAmount(tmpl.amount);
    setSelectedCategory(tmpl.categoryId);
    setNotes(tmpl.note);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return alert('Please enter a valid amount');
    
    const catObj = activeCategoryList.find((c) => c.id === selectedCategory);

    addTransaction({
      account_id: selectedAccount,
      category_id: selectedCategory,
      category_name: catObj ? catObj.name : 'General',
      amount: Number(amount),
      type: type,
      notes: notes,
      transaction_date: `${loggedDate}T${loggedTime}:00`,
      is_recurring: isRecurring,
      recurring_rule: isRecurring ? {
        frequency: recurringFrequency,
        stopCondition: stopCondition,
        stopDate: stopCondition === 'on_date' ? stopDate : null,
        stopCount: stopCondition === 'after_count' ? Number(stopCount) : null,
      } : null,
    });

    onClose();
    setAmount('');
    setNotes('');
    setActiveTemplate(null);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
    >
      {/* Widen container so text and categories aren't cut off */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl border-2 border-gray-900 shadow-2xl text-gray-900 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-400"></span>
            <h3 className="text-xl font-black text-gray-900">
              Log {type === 'income' ? 'Income' : 'Expense'} Entry
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Quick Templates Bar */}
        <div className="mb-5 bg-[#FFF2B2]/60 p-3.5 rounded-2xl border border-yellow-300/80">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
              <Layout size={14} /> Quick Entry Templates
            </span>
            <span className="text-[10px] font-bold text-amber-900">Click to autofill</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {presetTemplates.map((tmpl) => {
              const TIcon = tmpl.icon;
              const isSelected = activeTemplate === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black cursor-pointer whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-gray-900 text-white border-gray-900 shadow-2xs'
                      : 'bg-white text-gray-800 border-yellow-400 hover:bg-yellow-100'
                  }`}
                >
                  <TIcon size={14} className={isSelected ? 'text-amber-300' : 'text-amber-600'} />
                  <span>{tmpl.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Income vs Expense Toggle */}
          <div className="flex bg-[#FFF2B2] p-1.5 rounded-2xl border border-yellow-300">
            <button
              type="button"
              onClick={() => { setType('expense'); setSelectedCategory('c4'); }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                type === 'expense' ? 'bg-[#1F2937] text-white shadow-sm' : 'text-gray-800'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setSelectedCategory('c1'); }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                type === 'income' ? 'bg-[#1F2937] text-white shadow-sm' : 'text-gray-800'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Amount (₱)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-2xl font-black p-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-gray-900 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Note / Tag Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Note / Description</label>
              <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Tag size={10} /> Tag
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g. Netflix, Wifi bill, Groceries"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Category Chips Grid (Wider 2-col to 3-col Grid so names fit completely) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">
                {type === 'income' ? 'INCOME CATEGORIES' : 'EXPENSE CATEGORIES'}
              </label>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(true)}
                className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-yellow-300 flex items-center gap-1 cursor-pointer hover:bg-yellow-200"
              >
                <Plus size={12} /> Add Category
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {activeCategoryList.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 font-extrabold text-xs transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-gray-900 bg-gray-900 text-white shadow-xs'
                        : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <span className={`p-2 rounded-xl flex-shrink-0 ${cat.color}`}>
                      <Icon size={16} />
                    </span>
                    <span className="leading-snug">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logged At Date & Time */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">LOGGED AT</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl">
                <Calendar size={16} className="text-gray-400" />
                <input
                  type="date"
                  value={loggedDate}
                  onChange={(e) => setLoggedDate(e.target.value)}
                  className="bg-transparent font-bold text-xs text-gray-900 focus:outline-none w-full"
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl">
                <Clock size={16} className="text-gray-400" />
                <input
                  type="time"
                  value={loggedTime}
                  onChange={(e) => setLoggedTime(e.target.value)}
                  className="bg-transparent font-bold text-xs text-gray-900 focus:outline-none w-full"
                />
              </div>
            </div>
          </div>

          {/* Enhanced Recurring Options Section */}
          <div className="p-4 bg-[#FFF2B2] rounded-2xl border border-yellow-300 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-gray-900 flex items-center gap-2">
                <Repeat size={16} /> Set as recurring {type}
              </span>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                  isRecurring ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-md"></span>
              </button>
            </div>

            {isRecurring && (
              <div className="pt-2 border-t border-yellow-300/80 space-y-3 animate-fadeIn">
                {/* Frequency Picker */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-amber-950 mb-1">RECURRING FREQUENCY</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['daily', 'weekly', 'monthly', 'yearly'].map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setRecurringFrequency(freq)}
                        className={`py-1.5 text-xs font-extrabold capitalize rounded-xl border cursor-pointer ${
                          recurringFrequency === freq
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-800 border-yellow-300'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stop Condition Rules */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-amber-950 mb-1">RECURRENCE END RULE</label>
                  <select
                    value={stopCondition}
                    onChange={(e) => setStopCondition(e.target.value)}
                    className="w-full p-2.5 bg-white border border-yellow-400 rounded-xl text-xs font-bold text-gray-900"
                  >
                    <option value="never">Never stops (Ongoing)</option>
                    <option value="on_date">Ends on specific date</option>
                    <option value="after_count">Ends after X occurrences</option>
                  </select>
                </div>

                {/* Conditional Inputs */}
                {stopCondition === 'on_date' && (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-amber-950 mb-1">END DATE</label>
                    <input
                      type="date"
                      value={stopDate}
                      onChange={(e) => setStopDate(e.target.value)}
                      className="w-full p-2.5 bg-white border border-yellow-400 rounded-xl text-xs font-bold text-gray-900"
                    />
                  </div>
                )}

                {stopCondition === 'after_count' && (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-amber-950 mb-1">NUMBER OF TIMES</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 12"
                      value={stopCount}
                      onChange={(e) => setStopCount(e.target.value)}
                      className="w-full p-2.5 bg-white border border-yellow-400 rounded-xl text-xs font-bold text-gray-900"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Account Picker & Submit Button */}
          <div className="flex gap-3 pt-2">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">ACCOUNT</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xs font-bold text-gray-900"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (₱{Number(acc.balance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex items-end">
              <button
                type="submit"
                className="w-full py-3.5 bg-[#FFF2B2] hover:bg-amber-300 border-2 border-gray-900 font-black text-gray-900 rounded-2xl shadow-sm text-xs transition-all cursor-pointer"
              >
                Save {type === 'income' ? 'Income' : 'Expense'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Add Custom Category Modal with Icon Grid & Color Picker */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border-2 border-gray-900 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-black text-gray-900 mb-1">Create Custom Category</h4>
            <p className="text-xs text-gray-500 font-semibold mb-4">Pick an icon & color for your custom category</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pet Care, Tuition, Gaming"
                  value={customCatName}
                  onChange={(e) => setCustomCatName(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Distinct Icon Grid Palettes for Income vs Expense */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Select Icon ({type === 'income' ? 'Income Icons' : 'Expense Icons'})
                  </label>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                    {type}
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-2 p-2 bg-gray-50 rounded-2xl border-2 border-gray-200">
                  {(type === 'income' ? [
                    { id: 'DollarSign', icon: DollarSign, name: 'Salary' },
                    { id: 'Gift', icon: Gift, name: 'Gift' },
                    { id: 'Briefcase', icon: Briefcase, name: 'Freelance' },
                    { id: 'Zap', icon: Zap, name: 'Bonus' },
                    { id: 'TrendingUp', icon: TrendingUp, name: 'Interest' },
                    { id: 'CreditCard', icon: CreditCard, name: 'Cashback' },
                    { id: 'Layers', icon: Layers, name: 'Dividend' },
                    { id: 'HomeIcon', icon: HomeIcon, name: 'Rental' },
                    { id: 'BookOpen', icon: BookOpen, name: 'Grant' },
                    { id: 'Shield', icon: Shield, name: 'Refund' },
                    { id: 'Plane', icon: Plane, name: 'Travel Allowance' },
                    { id: 'Grid', icon: Grid, name: 'Other Income' },
                  ] : [
                    { id: 'Utensils', icon: Utensils, name: 'Food' },
                    { id: 'ShoppingBag', icon: ShoppingBag, name: 'Shopping' },
                    { id: 'Bus', icon: Bus, name: 'Transport' },
                    { id: 'Smartphone', icon: Smartphone, name: 'Bills & Phone' },
                    { id: 'Gamepad2', icon: Gamepad2, name: 'Fun & Gaming' },
                    { id: 'Heart', icon: Heart, name: 'Health' },
                    { id: 'Coffee', icon: Coffee, name: 'Drinks & Cafes' },
                    { id: 'HomeIcon', icon: HomeIcon, name: 'Housing & Rent' },
                    { id: 'BookOpen', icon: BookOpen, name: 'Education' },
                    { id: 'Plane', icon: Plane, name: 'Vacation' },
                    { id: 'Shield', icon: Shield, name: 'Insurance' },
                    { id: 'Grid', icon: Grid, name: 'Other Expense' },
                  ]).map((item) => {
                    const IconComp = item.icon;
                    const isSel = selectedIconId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedIconId(item.id)}
                        title={item.name}
                        className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                          isSel ? 'bg-gray-900 text-white border-gray-900 shadow-2xs' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <IconComp size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Picker: HEX & RGB Mode Tabs + Presaved Palette + Sliders */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-700">Category Color</label>
                  <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setColorMode('hex')}
                      className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md cursor-pointer ${
                        colorMode === 'hex' ? 'bg-gray-900 text-white' : 'text-gray-600'
                      }`}
                    >
                      HEX
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorMode('rgb')}
                      className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md cursor-pointer ${
                        colorMode === 'rgb' ? 'bg-gray-900 text-white' : 'text-gray-600'
                      }`}
                    >
                      RGB
                    </button>
                  </div>
                </div>

                {/* Presaved Palette Swatches */}
                <div className="flex items-center gap-2 justify-between mb-3">
                  {[
                    '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#06B6D4'
                  ].map((hex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setCustomHexColor(hex);
                        // parse hex to rgb
                        const r = parseInt(hex.slice(1,3), 16);
                        const g = parseInt(hex.slice(3,5), 16);
                        const b = parseInt(hex.slice(5,7), 16);
                        setRgbR(r); setRgbG(g); setRgbB(b);
                      }}
                      className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-transform ${
                        customHexColor === hex ? 'scale-125 border-gray-900 shadow-md' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: hex }}
                    ></button>
                  ))}
                </div>

                {/* Color Input Controls */}
                {colorMode === 'hex' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl border-2 border-gray-900 flex-shrink-0 shadow-2xs" style={{ backgroundColor: customHexColor }}></div>
                    <input
                      type="text"
                      placeholder="#508A59"
                      value={customHexColor}
                      onChange={(e) => setCustomHexColor(e.target.value)}
                      className="flex-1 p-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-2 p-3 bg-gray-50 rounded-2xl border-2 border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-rose-600 w-4">R</span>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={rgbR}
                        onChange={(e) => handleRgbChange(Number(e.target.value), rgbG, rgbB)}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-gray-800 w-8 text-right">{rgbR}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-emerald-600 w-4">G</span>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={rgbG}
                        onChange={(e) => handleRgbChange(rgbR, Number(e.target.value), rgbB)}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-gray-800 w-8 text-right">{rgbG}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-blue-600 w-4">B</span>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={rgbB}
                        onChange={(e) => handleRgbChange(rgbR, rgbG, Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-gray-800 w-8 text-right">{rgbB}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
                      <span className="text-[10px] font-bold text-gray-500">Preview:</span>
                      <div className="w-full h-5 rounded-lg border border-gray-400 font-mono text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: customHexColor }}>
                        rgb({rgbR}, {rgbG}, {rgbB})
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-2xl font-bold text-xs text-gray-600 cursor-pointer hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!customCatName) return alert('Please enter a category name');
                    alert(`Custom Category "${customCatName}" created with color ${customHexColor}!`);
                    setCustomCatName('');
                    setShowAddCategoryModal(false);
                  }}
                  className="flex-1 py-3 bg-[#FFF2B2] hover:bg-amber-300 border-2 border-gray-900 font-black text-xs text-gray-900 rounded-2xl cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
