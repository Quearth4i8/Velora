import { supabase } from './supabase';

const FALLBACK_STORAGE_KEY = 'miniGamePoints';
const SPIN_PITY_STORAGE_KEY = 'spinPityCount';

const safeInt = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
};

export const wallet = {
  getLocalBalance(): number {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : 0;
      return safeInt(parsed);
    } catch {
      return 0;
    }
  },

  setLocalBalance(points: number) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(safeInt(points)));
  },

  async getBalance(): Promise<number> {
    // Check authentication via local API
    const authRes = await fetch('/api/auth/session');
    const authData = await authRes.json();
    if (!authData.user) return this.getLocalBalance();

    const { data, error } = await supabase
      .from('profiles')
      .select('points_balance')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (error) return 0;

    return safeInt((data as any)?.points_balance);
  },

  async setBalance(points: number): Promise<number> {
    const next = safeInt(points);
    // Check authentication via local API
    const authRes = await fetch('/api/auth/session');
    const authData = await authRes.json();
    if (!authData.user) {
      this.setLocalBalance(next);
      return next;
    }

    const { data, error } = await (supabase
      .from('profiles')
      .update({ points_balance: next, updated_at: new Date().toISOString() }) as any)
      .eq('id', authData.user.id)
      .select('points_balance')
      .maybeSingle();

    if (error) return next;

    return safeInt((data as any)?.points_balance);
  },

  async increment(delta: number): Promise<number> {
    const d = Math.floor(Number(delta));
    if (!Number.isFinite(d) || d === 0) return this.getBalance();

    // Check authentication via local API
    const authRes = await fetch('/api/auth/session');
    const authData = await authRes.json();
    if (!authData.user) {
      const next = safeInt(this.getLocalBalance() + d);
      this.setLocalBalance(next);
      return next;
    }

    const current = await this.getBalance();
    return this.setBalance(current + d);
  },

  async spend(cost: number): Promise<{ ok: boolean; balance: number }> {
    const c = safeInt(cost);
    const current = await this.getBalance();
    if (current < c) return { ok: false, balance: current };
    const next = await this.increment(-c);
    return { ok: true, balance: next };
  },

  getLocalSpinPity(): number {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = localStorage.getItem(SPIN_PITY_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : 0;
      return safeInt(parsed);
    } catch {
      return 0;
    }
  },

  setLocalSpinPity(value: number) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SPIN_PITY_STORAGE_KEY, JSON.stringify(safeInt(value)));
  },

  async getSpinPity(): Promise<number> {
    // Check authentication via local API
    const authRes = await fetch('/api/auth/session');
    const authData = await authRes.json();
    if (!authData.user) return this.getLocalSpinPity();

    const { data, error } = await supabase
      .from('profiles')
      .select('spin_pity_count')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (error) return 0;
    return safeInt((data as any)?.spin_pity_count);
  },

  async setSpinPity(value: number): Promise<number> {
    const next = safeInt(value);
    // Check authentication via local API
    const authRes = await fetch('/api/auth/session');
    const authData = await authRes.json();
    if (!authData.user) {
      this.setLocalSpinPity(next);
      return next;
    }

    const { data, error } = await (supabase
      .from('profiles')
      .update({ spin_pity_count: next, updated_at: new Date().toISOString() }) as any)
      .eq('id', authData.user.id)
      .select('spin_pity_count')
      .maybeSingle();

    if (error) return next;
    return safeInt((data as any)?.spin_pity_count);
  },
};
