'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { wallet } from '@/lib/wallet';

export default function BuyPointsPage() {
  const [balance, setBalance] = useState(0);
  const [isBuying, setIsBuying] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    wallet.getBalance().then(setBalance);
  }, []);

  const packages = useMemo(() => {
    return [
      { id: 'starter', title: 'Starter Pack', points: 100, price: '$0.99' },
      { id: 'value', title: 'Value Pack', points: 550, price: '$4.99', bonus: 'Best value' },
      { id: 'whale', title: 'Whale Pack', points: 1400, price: '$9.99', bonus: 'Big flex' },
      { id: 'daily', title: 'Daily Drip', points: 60, price: '$0.49', bonus: 'Small refill' },
    ];
  }, []);

  const buy = async (pkgId: string, points: number) => {
    setStatus('');
    setIsBuying(pkgId);
    try {
      const next = await wallet.increment(points);
      setBalance(next);
      setStatus(`Added +${points} points.`);
    } finally {
      setIsBuying('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <Navbar />

        <div className="w-full px-4 sm:px-8 lg:px-12 pt-10 pb-16">
          <div className="w-full max-w-[1100px] mx-auto">
            <div className="rounded-[32px] border border-white/10 bg-dark-950/20 backdrop-blur-xl overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <div className="text-xs text-white/50 font-semibold">Store</div>
                    <div className="text-3xl font-extrabold text-white">Buy Points</div>
                    <div className="text-sm text-dark-300 mt-2">This is a fake store for now (no real payments). It behaves like a real shop so the loop feels legit.</div>
                  </div>
                  <div className="px-5 py-3 rounded-2xl border border-white/10 bg-white/5">
                    <div className="text-xs text-white/50 font-semibold">Balance</div>
                    <div className="text-2xl font-extrabold text-white">{balance}</div>
                  </div>
                </div>

                {status && (
                  <div className="mt-4 text-sm font-extrabold text-pink-200">{status}</div>
                )}

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {packages.map((p) => (
                    <div key={p.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-extrabold text-white">{p.title}</div>
                          <div className="text-sm text-dark-300 mt-1">+{p.points} points</div>
                        </div>
                        <div className="text-sm font-extrabold text-white">{p.price}</div>
                      </div>

                      {'bonus' in p && p.bonus ? (
                        <div className="mt-3 inline-flex text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-pink-600/20 border border-pink-500/30 text-pink-200">
                          {p.bonus}
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => buy(p.id, p.points)}
                        disabled={!!isBuying}
                        className="mt-5 w-full px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-600 via-pink-500 to-pink-700 hover:from-pink-500 hover:via-pink-400 hover:to-pink-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold transition-colors"
                      >
                        {isBuying === p.id ? 'Processing…' : 'Buy'}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-[24px] border border-white/10 bg-dark-950/20 p-5 text-sm text-white/70">
                  Your next step later: hook these packages to a real payment provider. The wallet already uses the database balance.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
