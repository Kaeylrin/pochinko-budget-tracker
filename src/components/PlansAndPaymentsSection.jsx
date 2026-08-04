import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Target, CreditCard, DollarSign, Plus, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PlansAndPaymentsSection() {
  const { 
    commitments, 
    personalGoals, 
    accounts, 
    payCommitment, 
    addCommitment, 
    addPersonalGoal, 
    contributeToGoal 
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState('commitments'); // commitments vs goals
  
  // Pay Modal State
  const [payingCommitment, setPayingCommitment] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState(accounts[0]?.id || '1');

  // New Debt/Owed Form State
  const [newTitle, setNewTitle] = useState('');
  const [newVendor, setNewVendor] = useState('');
  const [newType, setNewType] = useState('debt');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('2026-08-15');
  const [newMonthly, setNewMonthly] = useState('');
  const [newTenure, setNewTenure] = useState('');

  // New Goal Form State
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalCurrent, setNewGoalCurrent] = useState('');

  // Goal Contribution Modal State
  const [savingGoal, setSavingGoal] = useState(null);
  const [saveAmount, setSaveAmount] = useState('');
  const [saveWalletId, setSaveWalletId] = useState(accounts[0]?.id || '1');

  const debtsList = commitments.filter((c) => c.type !== 'owed_to_me');
  const owedToMeList = commitments.filter((c) => c.type === 'owed_to_me');

  const handlePaySubmit = (e) => {
    e.preventDefault();
    if (!payingCommitment || !payAmount) return;
    const walletId = selectedWalletId || accounts[0]?.id;
    if (!walletId) return alert('Please select or create an account first!');
    payCommitment(payingCommitment.id, payAmount, walletId);
    setPayingCommitment(null);
    setPayAmount('');
  };

  const handleGoalSaveSubmit = (e) => {
    e.preventDefault();
    if (!savingGoal || !saveAmount) return;
    const walletId = saveWalletId || accounts[0]?.id;
    if (!walletId) return alert('Please select or create an account first!');
    contributeToGoal(savingGoal.id, saveAmount, walletId);
    setSavingGoal(null);
    setSaveAmount('');
  };

  const handleAddCommitmentSubmit = (e) => {
    e.preventDefault();
    if (!newTitle || !newAmount) return;

    let vendorStr = newVendor || newTitle;
    if (newType === 'installment' && newMonthly) {
      vendorStr = `${newVendor ? newVendor + ' • ' : ''}₱${Number(newMonthly).toLocaleString()}/mo (${newTenure || '12'} mos)`;
    }

    addCommitment({
      title: newTitle,
      type: newType,
      total_amount: Number(newAmount),
      remaining_balance: Number(newAmount),
      due_date: newDueDate,
      vendor: vendorStr,
      status: 'In Progress'
    });
    setNewTitle('');
    setNewVendor('');
    setNewAmount('');
    setNewMonthly('');
    setNewTenure('');
  };

  const handleAddGoalSubmit = (e) => {
    e.preventDefault();
    if (!newGoalTitle || !newGoalTarget) return;
    addPersonalGoal({
      title: newGoalTitle,
      target_amount: Number(newGoalTarget),
      current_amount: Number(newGoalCurrent) || 0,
      target_date: '2026-12-31',
      category: 'Savings'
    });
    setNewGoalTitle('');
    setNewGoalTarget('');
    setNewGoalCurrent('');
  };

  // Escape key listener for modal closing
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (payingCommitment) setPayingCommitment(null);
        if (savingGoal) setSavingGoal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [payingCommitment, savingGoal]);

  return (
    <div className="space-y-6">
      {/* Subtab Toggle Bar */}
      <div className="bg-white p-2 rounded-3xl border-2 border-gray-200 shadow-xs flex items-center justify-between">
        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('commitments')}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeSubTab === 'commitments' ? 'bg-[#FFF2B2] text-amber-950 border border-yellow-400 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Debts & Owed Money
          </button>
          <button
            onClick={() => setActiveSubTab('goals')}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeSubTab === 'goals' ? 'bg-[#FFF2B2] text-amber-950 border border-yellow-400 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Personal Savings Goals
          </button>
        </div>
      </div>

      {/* SECTION 1: DEBTS & MONEY OWED TO USER */}
      {activeSubTab === 'commitments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* My Debts & Installments */}
            <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-gray-900 text-base">My Debts & Bills to Pay</h3>
                  <p className="text-xs text-gray-500 font-medium">Loans, SpayLater, and credit commitments</p>
                </div>
                <span className="text-xs font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  {debtsList.length} Active
                </span>
              </div>

              <div className="space-y-3">
                {debtsList.map((com) => (
                  <div key={com.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-black text-gray-900 text-sm flex items-center gap-2">
                        {com.title}
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md">
                          {com.status || 'Active'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 font-semibold mt-0.5">
                        Due: {com.due_date || 'N/A'} • Total: ₱{Number(com.total_amount).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-black uppercase text-gray-400 block">REMAINING</span>
                        <span className="text-base font-black text-rose-600">
                          ₱{Number(com.remaining_balance).toLocaleString()}
                        </span>
                      </div>

                      {Number(com.remaining_balance) > 0 && (
                        <button
                          onClick={() => { setPayingCommitment(com); setPayAmount(com.remaining_balance.toString()); }}
                          className="bg-[#FFF2B2] hover:bg-amber-300 border-2 border-gray-900 font-black text-gray-900 px-4 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
                        >
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Money Owed to Me */}
            <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-gray-900 text-base">Money Owed to Me</h3>
                  <p className="text-xs text-gray-500 font-medium">Loans given to friends or expected income</p>
                </div>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {owedToMeList.length} Pending
                </span>
              </div>

              <div className="space-y-3">
                {owedToMeList.map((com) => (
                  <div key={com.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-black text-gray-900 text-sm">{com.title}</div>
                      <div className="text-xs text-gray-500 font-semibold mt-0.5">
                        Due: {com.due_date || 'N/A'} • Total: ₱{Number(com.total_amount).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-black uppercase text-gray-400 block">EXPECTED</span>
                        <span className="text-base font-black text-emerald-600">
                          ₱{Number(com.remaining_balance).toLocaleString()}
                        </span>
                      </div>

                      {Number(com.remaining_balance) > 0 && (
                        <button
                          onClick={() => { setPayingCommitment(com); setPayAmount(com.remaining_balance.toString()); }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-4 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
                        >
                          Collect
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form: Add New Debt or Money Owed */}
          {/* Form: Add Commitment Record with Dynamic Fields per Type */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs h-fit">
            <h3 className="font-black text-gray-900 text-base mb-1">Add Commitment Record</h3>
            <p className="text-xs text-gray-500 font-semibold mb-4">Fields adapt based on commitment type</p>

            <form onSubmit={handleAddCommitmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Commitment Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:border-amber-400 focus:outline-none"
                >
                  <option value="debt">I owe this (Debt / Bill)</option>
                  <option value="owed_to_me">Owed to me (Friend Loan / Expected)</option>
                  <option value="installment">Installment Purchase</option>
                </select>
              </div>

              {/* Dynamic Title / Person Field */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {newType === 'debt' && 'Bill / Debt Name'}
                  {newType === 'owed_to_me' && 'Person / Borrower Name'}
                  {newType === 'installment' && 'Item / Purchase Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    newType === 'debt'
                      ? 'e.g. Electric Bill, SpayLater Bill'
                      : newType === 'owed_to_me'
                      ? 'e.g. Alex, Maria'
                      : 'e.g. iPhone 15, Refrigerator'
                  }
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-900 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Dynamic Creditor / Store Field */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {newType === 'debt' && 'Vendor / Creditor (Optional)'}
                  {newType === 'owed_to_me' && 'Loan Purpose / Description'}
                  {newType === 'installment' && 'Merchant / Store Name'}
                </label>
                <input
                  type="text"
                  placeholder={
                    newType === 'debt'
                      ? 'e.g. Meralco, Shopee'
                      : newType === 'owed_to_me'
                      ? 'e.g. Emergency Cash, Laptop Borrow'
                      : 'e.g. Abenson, Power Mac'
                  }
                  value={newVendor}
                  onChange={(e) => setNewVendor(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-900 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Dynamic Installment Extra Fields */}
              {newType === 'installment' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1">Monthly Pay (₱)</label>
                    <input
                      type="number"
                      placeholder="e.g. 2500"
                      value={newMonthly}
                      onChange={(e) => setNewMonthly(e.target.value)}
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1">Months Tenure</label>
                    <input
                      type="number"
                      placeholder="e.g. 12"
                      value={newTenure}
                      onChange={(e) => setNewTenure(e.target.value)}
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {newType === 'owed_to_me' ? 'Total Amount Owed to You (₱)' : 'Total Amount (₱)'}
                </label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {newType === 'owed_to_me' ? 'Expected Repayment Date' : 'Due Date'}
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#FFF2B2] hover:bg-amber-300 border border-yellow-400 font-black text-gray-900 rounded-2xl text-xs cursor-pointer transition-all shadow-xs active:scale-[0.98]"
              >
                Save Commitment Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 2: PERSONAL SAVINGS GOALS */}
      {activeSubTab === 'goals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-black text-gray-900 text-lg">Personal Savings & Purchase Goals</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {personalGoals.map((goal) => {
                const pct = Math.min(100, (Number(goal.current_amount) / Number(goal.target_amount)) * 100);
                return (
                  <div key={goal.id} className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-gray-900 text-base">{goal.title}</h4>
                          <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md mt-1 inline-block">
                            {goal.category}
                          </span>
                        </div>
                        <Target size={22} className="text-amber-500" />
                      </div>

                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-xs font-bold text-gray-700">
                          <span>Progress</span>
                          <span>{pct.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-200">
                          <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-gray-400 block">SAVED / TARGET</span>
                        <span className="text-sm font-black text-gray-900">
                          ₱{Number(goal.current_amount).toLocaleString()} / ₱{Number(goal.target_amount).toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={() => { setSavingGoal(goal); setSaveAmount('500'); }}
                        className="bg-[#1F2937] hover:bg-black text-[#FFF2B2] font-black px-4 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
                      >
                        + Add Savings
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form: Add Personal Goal */}
          <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-xs h-fit">
            <h3 className="font-black text-gray-900 text-base mb-4">Create Personal Goal</h3>
            <form onSubmit={handleAddGoalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Fund or Travel"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Amount (₱)</label>
                <input
                  type="number"
                  required
                  placeholder="50000"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Initial Saved (₱)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newGoalCurrent}
                  onChange={(e) => setNewGoalCurrent(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#FFF2B2] hover:bg-amber-300 border-2 border-gray-900 font-black text-gray-900 rounded-2xl text-sm cursor-pointer"
              >
                Create Savings Goal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL (WITH BACKDROP CLICK & ESCAPE KEY CLOSING) */}
      {payingCommitment && (
        <div 
          onClick={() => setPayingCommitment(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 w-full max-w-md border-2 border-gray-900 shadow-2xl text-gray-900"
          >
            <h3 className="text-lg font-black text-gray-900 mb-1">
              {payingCommitment.type === 'owed_to_me' ? 'Collect Money' : 'Pay Debt / Bill'}
            </h3>
            <p className="text-xs text-gray-500 font-semibold mb-4">
              Item: {payingCommitment.title}
            </p>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Amount (₱)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full p-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xl font-black text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Wallet / Account</label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xs font-bold text-gray-900"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Balance: ₱{Number(acc.balance).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingCommitment(null)}
                  className="flex-1 py-3 border border-gray-300 rounded-2xl font-bold text-gray-600 text-xs cursor-pointer hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#FFF2B2] hover:bg-amber-300 border-2 border-gray-900 font-black text-gray-900 rounded-2xl text-xs cursor-pointer"
                >
                  Confirm Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GOAL SAVINGS MODAL (WITH BACKDROP CLICK & ESCAPE KEY CLOSING) */}
      {savingGoal && (
        <div 
          onClick={() => setSavingGoal(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 w-full max-w-md border-2 border-gray-900 shadow-2xl text-gray-900"
          >
            <h3 className="text-lg font-black text-gray-900 mb-1">Add Savings to Goal</h3>
            <p className="text-xs text-gray-500 font-semibold mb-4">Goal: {savingGoal.title}</p>

            <form onSubmit={handleGoalSaveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Savings Amount (₱)</label>
                <input
                  type="number"
                  required
                  value={saveAmount}
                  onChange={(e) => setSaveAmount(e.target.value)}
                  className="w-full p-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xl font-black text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Source Wallet / Account</label>
                <select
                  value={saveWalletId}
                  onChange={(e) => setSaveWalletId(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xs font-bold text-gray-900"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Balance: ₱{Number(acc.balance).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSavingGoal(null)}
                  className="flex-1 py-3 border border-gray-300 rounded-2xl font-bold text-gray-600 text-xs cursor-pointer hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#1F2937] hover:bg-black text-[#FFF2B2] font-black rounded-2xl text-xs cursor-pointer"
                >
                  Save Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
