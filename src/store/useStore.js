import { create } from 'zustand';

const initialAccounts = [
  { id: '1', name: 'GCash', type: 'e-wallet', balance: 101.62, categoryGroup: 'E-Wallets', color: '#10B981', template_identifier: 'gcash' },
  { id: '2', name: 'Maya', type: 'e-wallet', balance: 0.00, categoryGroup: 'E-Wallets', color: '#059669', template_identifier: 'maya' },
  { id: '3', name: 'MariBank', type: 'debit', balance: 63.68, categoryGroup: 'Banks', color: '#F59E0B', subtext: 'Debit • PHP • 3.75% P.A.', template_identifier: 'debit', annual_interest_rate: 3.75, interest_frequency: 'daily', withholding_tax: 20, maintaining_balance: 0 },
  { id: '4', name: 'GoTyme', type: 'debit', balance: 2000.00, categoryGroup: 'Banks', color: '#06B6D4', subtext: 'Debit • PHP • 4.0% P.A.', template_identifier: 'debit', annual_interest_rate: 4.0, interest_frequency: 'monthly', withholding_tax: 20, maintaining_balance: 500 },
  { id: '5', name: 'SpayLater', type: 'pay_later', balance: 2893.50, categoryGroup: 'Liabilities', color: '#EF4444', template_identifier: 'shopeepaylater' },
];

const initialCategories = [
  { id: 'c1', name: 'Gift / Allowance', type: 'income', icon: 'Gift', color: '#EC4899' },
  { id: 'c2', name: 'Freelance', type: 'income', icon: 'Briefcase', color: '#10B981' },
  { id: 'c3', name: 'Fees & Subscriptions', type: 'expense', icon: 'CreditCard', color: '#F59E0B' },
  { id: 'c4', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#F97316' },
  { id: 'c5', name: 'Fun & Entertainment', type: 'expense', icon: 'Gamepad2', color: '#8B5CF6' },
  { id: 'c6', name: 'Transport', type: 'expense', icon: 'Bus', color: '#3B82F6' },
  { id: 'c7', name: 'Other Expenses', type: 'expense', icon: 'Grid', color: '#6B7280' },
];

const initialTransactions = [
  { id: 't1', account_id: '1', category_id: 'c1', category_name: 'Gift / Allowance', amount: 1876.95, type: 'income', transaction_date: new Date(Date.now() - 86400000 * 2).toISOString(), notes: 'Monthly Allowance' },
  { id: 't2', account_id: '5', category_id: 'c3', category_name: 'Fees & Subscriptions', amount: 6984.00, type: 'expense', transaction_date: new Date(Date.now() - 86400000 * 1).toISOString(), notes: 'Software License Fees' },
  { id: 't3', account_id: '1', category_id: 'c4', category_name: 'Food & Dining', amount: 747.00, type: 'expense', transaction_date: new Date().toISOString(), notes: 'Groceries and snacks' },
  { id: 't4', account_id: '3', category_id: 'c5', category_name: 'Fun & Entertainment', amount: 569.93, type: 'expense', transaction_date: new Date(Date.now() - 86400000 * 3).toISOString(), notes: 'Gaming subscription' },
  { id: 't5', account_id: '4', category_id: 'c6', category_name: 'Transport', amount: 225.00, type: 'expense', transaction_date: new Date(Date.now() - 86400000 * 4).toISOString(), notes: 'Commute reload' },
  { id: 't6', account_id: '1', category_id: 'c7', category_name: 'Other Expenses', amount: 781.38, type: 'expense', transaction_date: new Date(Date.now() - 86400000 * 5).toISOString(), notes: 'Misc supplies' },
];

const initialCommitments = [
  { id: 'm1', title: 'SpayLater Bill', type: 'debt', total_amount: 2893.50, remaining_balance: 40.75, due_date: '2026-08-05', vendor: 'Shopee', status: '3 days left' },
  { id: 'm2', title: 'Allowance Expected', type: 'owed_to_me', total_amount: 85.00, remaining_balance: 85.00, due_date: '2026-08-10', vendor: 'Allowance', status: 'Upcoming' },
  { id: 'm3', title: 'Laptop Loan to Alex', type: 'owed_to_me', total_amount: 2500.00, remaining_balance: 1200.00, due_date: '2026-08-18', vendor: 'Alex', status: 'In Progress' },
];

const initialPersonalGoals = [
  { id: 'g1', title: 'Emergency Fund', target_amount: 50000, current_amount: 15000, target_date: '2026-12-31', category: 'Savings' },
  { id: 'g2', title: 'New Laptop', target_amount: 45000, current_amount: 12500, target_date: '2026-10-15', category: 'Tech' },
];

export const useStore = create((set, get) => ({
  accounts: initialAccounts,
  categories: initialCategories,
  transactions: initialTransactions,
  commitments: initialCommitments,
  personalGoals: initialPersonalGoals,
  streakDays: 10,
  userName: 'Kaeyls',
  netWorth: 0,
  recentIncome: 1876.95,
  recentExpenses: 9408.42,

  // Calculate Net Worth: Add assets (debit/e-wallet), subtract liabilities (pay_later/credit)
  calculateNetWorth: () => {
    const { accounts } = get();
    const total = accounts.reduce((sum, acc) => {
      const val = Number(acc.balance) || 0;
      if (acc.type === 'credit' || acc.type === 'pay_later') {
        return sum - val;
      }
      return sum + val;
    }, 0);
    set({ netWorth: total });
  },

  setAccounts: (accounts) => {
    set({ accounts });
    get().calculateNetWorth();
  },

  addTransaction: (tx) => {
    const newTx = {
      ...tx,
      id: 't_' + Date.now(),
      transaction_date: tx.transaction_date || new Date().toISOString(),
    };
    
    // Update account balance
    const accounts = get().accounts.map((acc) => {
      if (acc.id === tx.account_id) {
        const currentBal = Number(acc.balance) || 0;
        const txAmount = Number(tx.amount) || 0;
        const updatedBal = tx.type === 'income' ? currentBal + txAmount : currentBal - txAmount;
        return { ...acc, balance: updatedBal };
      }
      return acc;
    });

    const isIncome = tx.type === 'income';
    const amount = Number(tx.amount) || 0;

    set((state) => ({
      transactions: [newTx, ...state.transactions],
      accounts,
      recentIncome: isIncome ? state.recentIncome + amount : state.recentIncome,
      recentExpenses: !isIncome ? state.recentExpenses + amount : state.recentExpenses,
    }));

    get().calculateNetWorth();
  },

  deleteTransaction: (id) => {
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    get().calculateNetWorth();
  },

  addAccount: (acc) => {
    const newAcc = { 
      ...acc, 
      id: 'a_' + Date.now(),
      categoryGroup: acc.type === 'pay_later' || acc.type === 'credit' ? 'Liabilities' : (acc.type === 'debit' ? 'Banks' : 'E-Wallets'),
      color: acc.type === 'pay_later' ? '#EF4444' : '#10B981'
    };
    set((state) => ({ accounts: [...state.accounts, newAcc] }));
    get().calculateNetWorth();
  },

  // Automatic Daily Interest Calculator Engine (Runs silently in background)
  autoProcessDailyInterest: () => {
    const { accounts } = get();
    const todayStr = new Date().toISOString().slice(0, 10);
    
    let hasUpdated = false;
    const updatedAccounts = accounts.map((acc) => {
      const rate = Number(acc.annual_interest_rate) || 0;
      const bal = Number(acc.balance) || 0;

      // Only compute for accounts with active interest rate
      if (rate > 0 && bal > 0 && acc.last_interest_date !== todayStr) {
        const taxRate = Number(acc.withholding_tax ?? 20) / 100;
        const grossDailyInterest = (bal * (rate / 100)) / 365;
        const netDailyInterest = grossDailyInterest * (1 - taxRate);

        hasUpdated = true;
        return {
          ...acc,
          balance: Number((bal + netDailyInterest).toFixed(2)),
          last_interest_date: todayStr,
          last_daily_interest_earned: Number(netDailyInterest.toFixed(2))
        };
      }
      return acc;
    });

    if (hasUpdated) {
      set({ accounts: updatedAccounts });
      get().calculateNetWorth();
    }
  },

  addCommitment: (com) => {
    const newCom = { ...com, id: 'cm_' + Date.now() };
    set((state) => ({ commitments: [...state.commitments, newCom] }));
  },

  payCommitment: (commitmentId, paymentAmount, accountId) => {
    const { commitments, accounts, addTransaction } = get();
    const targetCom = commitments.find((c) => c.id === commitmentId);
    const targetAcc = accounts.find((a) => a.id === accountId);

    if (!targetCom || !targetAcc) return alert('Invalid commitment or payment account!');

    const payVal = Number(paymentAmount);
    if (payVal <= 0) return alert('Enter a valid payment amount');

    // Deduct from wallet balance & create transaction
    const isReceiving = targetCom.type === 'owed_to_me';
    
    addTransaction({
      account_id: accountId,
      category_id: 'c3',
      category_name: isReceiving ? 'Debt Collection' : 'Debt Payment',
      amount: payVal,
      type: isReceiving ? 'income' : 'expense',
      notes: `${isReceiving ? 'Collected' : 'Paid'} for: ${targetCom.title}`,
      transaction_date: new Date().toISOString(),
    });

    // Update remaining balance on commitment
    const updatedCommitments = commitments.map((c) => {
      if (c.id === commitmentId) {
        const newBal = Math.max(0, Number(c.remaining_balance) - payVal);
        return { 
          ...c, 
          remaining_balance: newBal, 
          status: newBal === 0 ? 'Fully Settled' : 'In Progress' 
        };
      }
      return c;
    });

    set({ commitments: updatedCommitments });
  },

  addPersonalGoal: (goal) => {
    const newGoal = { ...goal, id: 'g_' + Date.now(), current_amount: Number(goal.current_amount) || 0 };
    set((state) => ({ personalGoals: [...state.personalGoals, newGoal] }));
  },

  contributeToGoal: (goalId, amount, accountId) => {
    const { personalGoals, accounts, addTransaction } = get();
    const goal = personalGoals.find((g) => g.id === goalId);
    if (!goal) return;

    const val = Number(amount);
    if (val <= 0) return alert('Enter a valid contribution amount');

    // Create expense transaction for goal allocation
    addTransaction({
      account_id: accountId,
      category_id: 'c7',
      category_name: 'Goal Savings',
      amount: val,
      type: 'expense',
      notes: `Savings contribution: ${goal.title}`,
      transaction_date: new Date().toISOString(),
    });

    const updatedGoals = personalGoals.map((g) => {
      if (g.id === goalId) {
        return { ...g, current_amount: Number(g.current_amount) + val };
      }
      return g;
    });

    set({ personalGoals: updatedGoals });
  },

  exportToCSV: () => {
    const { transactions } = get();
    if (!transactions.length) return alert('No transaction data to export!');

    const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Notes'].join(',') + '\n';
    const rows = transactions
      .map((t) =>
        [
          t.id,
          `"${new Date(t.transaction_date).toLocaleDateString()}"`,
          t.type,
          `"${t.category_name || 'General'}"`,
          t.amount,
          `"${(t.notes || '').replace(/"/g, '""')}"`,
        ].join(',')
      )
      .join('\n');

    const csvString = headers + rows;
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pochinko_finances_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
}));

useStore.getState().calculateNetWorth();
