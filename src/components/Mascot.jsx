import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

const financialAdvicePool = {
  inTheRed: [
    "You are already in the red. Only cover essentials until more money comes in.",
    "Your liabilities exceed active assets. Pause non-essential shopping for now!",
    "High expense ratio detected! Prioritize clearing debt and upcoming bill payments.",
    "Budget warning: Spending exceeds recent income. Time to trim subscriptions!",
    "Emergency protocol: Freeze discretionary spending and negotiate payment plans for debts.",
    "Focus on net cash recovery! Put all spare funds toward your highest-interest liability.",
    "Avoid taking on new Pay Later obligations until your net worth returns to positive green."
  ],
  highExpenses: [
    "Recent expenses are spiking. Consider reviewing your top spending categories.",
    "You've spent more than 70% of recent influx. Slow down discretionary spending.",
    "Frequent transactions logged today. Keep an eye on small micro-purchases!",
    "Food and entertainment spending is surging. Plan meals ahead to save cash.",
    "Before making your next purchase, ask if it's a 'Need' or a 'Want'!",
    "High outflow alert: Set spending caps on entertainment and dining categories this week.",
    "Check your active recurring subscriptions! Cancel any streaming services you rarely use."
  ],
  goodIncome: [
    "Great income influx! Remember to allocate at least 20% into savings or debt payoff.",
    "Your cashflow is positive! Consider building an emergency fund covering 3 to 6 months.",
    "Strong earnings recorded! Keep this momentum to grow your overall net worth.",
    "Pay yourself first! Transfer a portion of today's income into your high-yield digital bank.",
    "Excellent month! Consider locking a portion into digital bank high-yield interest accounts.",
    "Thriving cashflow! Now is a great time to make extra contributions to your personal goals.",
    "Keep lifestyle inflation in check! Save the surplus rather than raising daily expenses."
  ],
  steady: [
    "Steady cashflow! Consistently tracking every peso is the fastest path to wealth.",
    "Balanced account activity. Keep logging daily transfers, bills, and purchases.",
    "You are in control of your finances. Regular check-ins build strong money habits.",
    "Consistency is key! Every logged expense gives you clearer financial foresight.",
    "Check your bank interest rules! Ensure your digital wallets meet maintaining balance minimums.",
    "Financial security comes from small daily wins. You are building solid habits!",
    "Pro tip: Re-evaluate your budget at the end of every week to catch unexpected leaks early."
  ]
};

export default function Mascot({ recentExpenses, recentIncome, netWorth, transactionsCount = 0 }) {
  const [interactiveCount, setInteractiveCount] = useState(0);
  const [adviceIndex, setAdviceIndex] = useState(0);

  // Determine current financial scenario
  let scenario = 'steady';
  let mood = 'neutral';
  let badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
  let statusText = 'Starter Balance';

  if (netWorth < 0 || (recentExpenses > recentIncome && recentIncome > 0)) {
    scenario = 'inTheRed';
    mood = 'sweating';
    badgeColor = 'bg-rose-100 text-rose-900 border-rose-300';
    statusText = 'In The Red';
  } else if (recentExpenses > recentIncome * 0.7 && recentExpenses > 0) {
    scenario = 'highExpenses';
    mood = 'sweating';
    badgeColor = 'bg-[#FFF2B2] text-amber-950 border-amber-400';
    statusText = 'High Outflow';
  } else if (recentIncome > recentExpenses && recentIncome > 0) {
    scenario = 'goodIncome';
    mood = 'celebrating';
    badgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-300';
    statusText = 'Thriving';
  }

  const advices = financialAdvicePool[scenario] || financialAdvicePool.steady;
  const currentAdvice = advices[adviceIndex % advices.length];

  // Rotate advice when clicked or every 12 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setAdviceIndex((prev) => prev + 1);
    }, 12000);
    return () => clearInterval(timer);
  }, [scenario]);

  const triggerPoke = () => {
    setInteractiveCount((c) => c + 1);
    setAdviceIndex((prev) => prev + 1); // Get next financial tip on interaction
    confetti({
      particleCount: 50,
      spread: 85,
      origin: { y: 0.7 },
      colors: ['#FFF2B2', '#1F2937', '#10B981', '#F59E0B'],
    });
  };

  return (
    <div className="bg-[#FFF2B2] p-6 rounded-3xl border-2 border-gray-900/10 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-6 group transition-all duration-300 hover:shadow-md">
      {/* Prominent Mascot Button with Micro-animations */}
      <button
        onClick={triggerPoke}
        className="relative group-hover:scale-105 active:scale-95 transition-transform duration-300 cursor-pointer focus:outline-none flex-shrink-0"
        title="Click Pochinko for next financial advice tip!"
      >
        <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-white p-2 border-4 border-gray-900/10 flex items-center justify-center shadow-md hover:border-amber-400 transition-colors">
          <img
            src="/pochinko.png"
            alt="Pochinko Mascot"
            className="w-full h-full object-contain drop-shadow-md select-none transform hover:rotate-3 transition-transform"
          />
        </div>

        {mood === 'sweating' && (
          <span className="absolute top-0 right-0 text-[10px] font-black uppercase bg-rose-500 text-white px-2.5 py-1 rounded-full shadow-md animate-pulse">
            Alert
          </span>
        )}
        {mood === 'celebrating' && (
          <span className="absolute top-0 right-0 text-[10px] font-black uppercase bg-emerald-500 text-white px-2.5 py-1 rounded-full shadow-md animate-pulse">
            Thriving
          </span>
        )}
      </button>

      {/* Dynamic Advice Speech Bubble */}
      <div className="flex-1 space-y-3 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-gray-900">Pochinko</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-950 bg-white/80 px-2.5 py-0.5 rounded-full border border-amber-900/20">
              AI Advisor
            </span>
          </div>

          <button
            onClick={triggerPoke}
            className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border cursor-pointer hover:opacity-80 transition-all ${badgeColor}`}
          >
            {statusText} • Tip #{ (adviceIndex % advices.length) + 1 }
          </button>
        </div>

        {/* Advice text box with smooth transition */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-900/10 shadow-2xs transition-all duration-300 relative group/tip">
          <p className="text-sm md:text-base font-extrabold text-gray-900 leading-relaxed">
            "{currentAdvice}"
          </p>
          <span className="text-[10px] font-bold text-gray-400 block mt-2">
            Click Pochinko to cycle financial tips & advice
          </span>
        </div>

        {interactiveCount > 0 && (
          <span className="inline-block text-xs font-black text-amber-950 bg-white/60 px-3 py-1 rounded-full">
            Interactive Advice Consults: {interactiveCount}x
          </span>
        )}
      </div>
    </div>
  );
}
