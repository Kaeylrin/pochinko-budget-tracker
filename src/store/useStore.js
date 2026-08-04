import { create } from 'zustand';
import { supabase } from '../supabaseClient';

const LOCAL_STORAGE_KEY = 'pochinko_app_state_v1';

const defaultCategories = [
  { id: 'c1', name: 'Gift / Allowance', type: 'income', icon: 'Gift', color: '#EC4899' },
  { id: 'c2', name: 'Freelance', type: 'income', icon: 'Briefcase', color: '#10B981' },
  { id: 'c3', name: 'Fees & Subscriptions', type: 'expense', icon: 'CreditCard', color: '#F59E0B' },
  { id: 'c4', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#F97316' },
  { id: 'c5', name: 'Fun & Entertainment', type: 'expense', icon: 'Gamepad2', color: '#8B5CF6' },
  { id: 'c6', name: 'Transport', type: 'expense', icon: 'Bus', color: '#3B82F6' },
  { id: 'c7', name: 'Other Expenses', type: 'expense', icon: 'Grid', color: '#6B7280' },
];

// Helper to load saved local state for unauthenticated / offline mode
const loadLocalState = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load local storage state:', e);
  }
  return null;
};

// Helper to save state to localStorage
const saveLocalState = (state) => {
  try {
    const payload = {
      accounts: state.accounts || [],
      categories: state.categories || defaultCategories,
      transactions: state.transactions || [],
      commitments: state.commitments || [],
      personalGoals: state.personalGoals || [],
      userName: state.userName || 'User',
      streakCountCriteria: state.streakCountCriteria || 'either',
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Failed to save to local storage:', e);
  }
};

const calculateDynamicStreak = (transactions, criteria = 'either') => {
  if (!transactions || transactions.length === 0) return 0;

  const filtered = transactions.filter((t) => {
    if (criteria === 'income') return t.type === 'income';
    if (criteria === 'expense') return t.type === 'expense';
    return true;
  });

  if (filtered.length === 0) return 0;

  const activeDates = new Set(
    filtered.map((t) => new Date(t.transaction_date).toISOString().slice(0, 10))
  );

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let currentCheck = activeDates.has(todayStr)
    ? today
    : activeDates.has(yesterdayStr)
    ? yesterday
    : null;

  if (!currentCheck) return 0;

  let streak = 0;
  while (true) {
    const checkStr = currentCheck.toISOString().slice(0, 10);
    if (activeDates.has(checkStr)) {
      streak += 1;
      currentCheck.setDate(currentCheck.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

const localSaved = loadLocalState();

export const useStore = create((set, get) => ({
  user: null,
  session: null,
  accounts: localSaved?.accounts || [],
  categories: localSaved?.categories || defaultCategories,
  transactions: localSaved?.transactions || [],
  commitments: localSaved?.commitments || [],
  personalGoals: localSaved?.personalGoals || [],
  streakDays: 0,
  streakCountCriteria: localSaved?.streakCountCriteria || 'either',
  userName: localSaved?.userName || 'User',
  netWorth: 0,
  recentIncome: 0,
  recentExpenses: 0,
  loading: false,

  setSession: (session) => {
    set({ session, user: session?.user || null });
    if (session?.user) {
      get().fetchUserData();
    } else {
      const local = loadLocalState();
      set({
        accounts: local?.accounts || [],
        categories: local?.categories || defaultCategories,
        transactions: local?.transactions || [],
        commitments: local?.commitments || [],
        personalGoals: local?.personalGoals || [],
        userName: local?.userName || 'User',
        streakCountCriteria: local?.streakCountCriteria || 'either',
      });
      get().recomputeStats();
    }
  },

  setUserName: async (newName) => {
    set({ userName: newName });
    saveLocalState(get());

    const { user } = get();
    if (user) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: newName,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Profile name update warning:', e);
      }
    }
  },

  setStreakCountCriteria: async (criteria) => {
    set({ streakCountCriteria: criteria });
    saveLocalState(get());
    const streak = calculateDynamicStreak(get().transactions, criteria);
    set({ streakDays: streak });

    const { user } = get();
    if (user) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          streak_count_criteria: criteria,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Profile streak criteria update warning:', e);
      }
    }
  },

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

  recomputeStats: () => {
    const { transactions, streakCountCriteria } = get();
    let inc = 0;
    let exp = 0;
    transactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') inc += amt;
      if (t.type === 'expense') exp += amt;
    });

    const calculatedStreak = calculateDynamicStreak(transactions, streakCountCriteria);

    set({
      recentIncome: inc,
      recentExpenses: exp,
      streakDays: calculatedStreak,
    });
    get().calculateNetWorth();

    // Persist to local storage if user is offline / unauthenticated
    if (!get().user) {
      saveLocalState(get());
    }
  },

  fetchUserData: async () => {
    const { user } = get();
    if (!user) return;
    set({ loading: true });

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        set({
          userName: profile.full_name || user.email?.split('@')[0] || 'User',
          streakCountCriteria: profile.streak_count_criteria || 'either',
        });
      } else {
        set({ userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User' });
      }

      const { data: accountsData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      const { data: commitmentsData } = await supabase
        .from('commitments')
        .select('*')
        .eq('user_id', user.id);

      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      set({
        accounts: accountsData || [],
        categories: categoriesData && categoriesData.length > 0 ? categoriesData : defaultCategories,
        transactions: transactionsData || [],
        commitments: commitmentsData || [],
        personalGoals: goalsData || [],
      });

      get().recomputeStats();
    } catch (err) {
      console.error('Error fetching Supabase data:', err);
    } finally {
      set({ loading: false });
    }
  },

  autoProcessDailyInterest: () => {
    const { accounts } = get();
    const todayStr = new Date().toISOString().slice(0, 10);
    
    let hasUpdated = false;
    const updatedAccounts = accounts.map((acc) => {
      const rate = Number(acc.annual_interest_rate) || 0;
      const bal = Number(acc.balance) || 0;

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
      if (!get().user) saveLocalState(get());
    }
  },

  addTransaction: async (tx) => {
    const { user, accounts, transactions } = get();

    const newTx = {
      account_id: tx.account_id,
      category_id: tx.category_id || null,
      category_name: tx.category_name || 'General',
      amount: Number(tx.amount) || 0,
      type: tx.type,
      notes: tx.notes || '',
      transaction_date: tx.transaction_date || new Date().toISOString(),
    };

    if (user) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert({ ...newTx, user_id: user.id })
          .select()
          .single();

        if (error) console.warn('Supabase transaction insert warning:', error.message);
        if (data) newTx.id = data.id;
      } catch (e) {
        console.warn('DB error:', e);
      }
    }

    if (!newTx.id) newTx.id = 't_' + Date.now();

    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === tx.account_id) {
        const currentBal = Number(acc.balance) || 0;
        const txAmount = Number(tx.amount) || 0;
        const updatedBal = tx.type === 'income' ? currentBal + txAmount : currentBal - txAmount;

        if (user) {
          supabase
            .from('accounts')
            .update({ balance: updatedBal })
            .eq('id', acc.id)
            .then();
        }

        return { ...acc, balance: updatedBal };
      }
      return acc;
    });

    set({
      transactions: [newTx, ...transactions],
      accounts: updatedAccounts,
    });

    get().recomputeStats();
  },

  deleteTransaction: async (id) => {
    const { user, transactions } = get();

    if (user) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch (e) {
        console.warn('Delete transaction warning:', e);
      }
    }

    const updated = transactions.filter((t) => t.id !== id);
    set({ transactions: updated });
    get().recomputeStats();
  },

  addAccount: async (acc) => {
    const { user, accounts } = get();

    const group = acc.type === 'pay_later' || acc.type === 'credit' ? 'Liabilities' : (acc.type === 'debit' ? 'Banks' : 'E-Wallets');

    const dbAcc = {
      name: acc.name,
      type: acc.type,
      balance: Number(acc.balance) || 0,
      template_identifier: acc.template_identifier || 'custom',
      category_group: group,
      color: acc.type === 'pay_later' ? '#EF4444' : '#10B981',
      subtext: acc.subtext || '',
      annual_interest_rate: Number(acc.annual_interest_rate) || 0,
      interest_frequency: acc.interest_frequency || 'daily',
      withholding_tax: Number(acc.withholding_tax ?? 20),
      maintaining_balance: Number(acc.maintaining_balance) || 0,
    };

    let createdAcc = { ...dbAcc, categoryGroup: group };

    if (user) {
      try {
        const { data, error } = await supabase
          .from('accounts')
          .insert({ ...dbAcc, user_id: user.id })
          .select()
          .single();

        if (error) {
          alert('Error adding account to database: ' + error.message);
        } else if (data) {
          createdAcc = { ...data, categoryGroup: data.category_group || group };
        }
      } catch (e) {
        console.warn('DB error:', e);
      }
    }

    if (!createdAcc.id) createdAcc.id = 'a_' + Date.now();

    set({ accounts: [...accounts, createdAcc] });
    get().calculateNetWorth();
    if (!user) saveLocalState(get());
  },

  deleteAccount: async (id) => {
    const { user, accounts } = get();

    if (user) {
      try {
        await supabase.from('accounts').delete().eq('id', id);
      } catch (e) {
        console.warn('Delete account warning:', e);
      }
    }

    const updated = accounts.filter((a) => a.id !== id);
    set({ accounts: updated });
    get().calculateNetWorth();
    if (!user) saveLocalState(get());
  },

  addCommitment: async (com) => {
    const { user, commitments } = get();

    const newCom = {
      title: com.title,
      type: com.type,
      total_amount: Number(com.total_amount) || 0,
      remaining_balance: Number(com.remaining_balance ?? com.total_amount) || 0,
      due_date: com.due_date || null,
      vendor: com.vendor || '',
      status: 'In Progress',
    };

    if (user) {
      try {
        const { data, error } = await supabase
          .from('commitments')
          .insert({ ...newCom, user_id: user.id })
          .select()
          .single();

        if (error) console.warn('Supabase commitment insert warning:', error.message);
        if (data) newCom.id = data.id;
      } catch (e) {
        console.warn('DB error:', e);
      }
    }

    if (!newCom.id) newCom.id = 'cm_' + Date.now();

    set({ commitments: [...commitments, newCom] });
    if (!user) saveLocalState(get());
  },

  payCommitment: async (commitmentId, paymentAmount, accountId) => {
    const { commitments, accounts, addTransaction, user } = get();
    const targetCom = commitments.find((c) => c.id === commitmentId);
    const targetAcc = accounts.find((a) => a.id === accountId);

    if (!targetCom || !targetAcc) return alert('Invalid commitment or payment account!');

    const payVal = Number(paymentAmount);
    if (payVal <= 0) return alert('Enter a valid payment amount');

    const isReceiving = targetCom.type === 'owed_to_me';

    await addTransaction({
      account_id: accountId,
      category_id: null,
      category_name: isReceiving ? 'Debt Collection' : 'Debt Payment',
      amount: payVal,
      type: isReceiving ? 'income' : 'expense',
      notes: `${isReceiving ? 'Collected' : 'Paid'} for: ${targetCom.title}`,
      transaction_date: new Date().toISOString(),
    });

    const newBal = Math.max(0, Number(targetCom.remaining_balance) - payVal);
    const newStatus = newBal === 0 ? 'Fully Settled' : 'In Progress';

    if (user) {
      try {
        await supabase
          .from('commitments')
          .update({ remaining_balance: newBal, status: newStatus })
          .eq('id', commitmentId);
      } catch (e) {
        console.warn('DB error:', e);
      }
    }

    const updatedCommitments = commitments.map((c) => {
      if (c.id === commitmentId) {
        return { ...c, remaining_balance: newBal, status: newStatus };
      }
      return c;
    });

    set({ commitments: updatedCommitments });
    if (!user) saveLocalState(get());
  },

  addPersonalGoal: async (goal) => {
    const { user, personalGoals } = get();

    const newGoal = {
      title: goal.title,
      target_amount: Number(goal.target_amount) || 0,
      current_amount: Number(goal.current_amount) || 0,
      target_date: goal.target_date || null,
      category: goal.category || 'Savings',
    };

    if (user) {
      try {
        const { data, error } = await supabase
          .from('goals')
          .insert({ ...newGoal, user_id: user.id })
          .select()
          .single();

        if (error) console.warn('Supabase goal insert warning:', error.message);
        if (data) newGoal.id = data.id;
      } catch (e) {
        console.warn('DB error:', e);
      }
    }

    if (!newGoal.id) newGoal.id = 'g_' + Date.now();

    set({ personalGoals: [...personalGoals, newGoal] });
    if (!user) saveLocalState(get());
  },

  contributeToGoal: async (goalId, amount, accountId) => {
    const { personalGoals, addTransaction, user } = get();
    const goal = personalGoals.find((g) => g.id === goalId);
    if (!goal) return;

    const val = Number(amount);
    if (val <= 0) return alert('Enter a valid contribution amount');

    await addTransaction({
      account_id: accountId,
      category_id: null,
      category_name: 'Goal Savings',
      amount: val,
      type: 'expense',
      notes: `Savings contribution: ${goal.title}`,
      transaction_date: new Date().toISOString(),
    });

    const newCurrent = Number(goal.current_amount) + val;

    if (user) {
      try {
        await supabase
          .from('goals')
          .update({ current_amount: newCurrent })
          .eq('id', goalId);
      } catch (e) {
        console.warn('DB error:', e);
      }
    }

    const updatedGoals = personalGoals.map((g) => {
      if (g.id === goalId) {
        return { ...g, current_amount: newCurrent };
      }
      return g;
    });

    set({ personalGoals: updatedGoals });
    if (!user) saveLocalState(get());
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
