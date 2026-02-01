'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type HeatMeterTier = 'cold' | 'warm' | 'hot';

export interface HeatMeterProps {
  value: number; // 0-100
  variant?: 'default' | 'embedded';
  className?: string;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const getTier = (value: number): HeatMeterTier => {
  if (value >= 70) return 'hot';
  if (value >= 35) return 'warm';
  return 'cold';
};

const getTierLabel = (tier: HeatMeterTier): string => {
  switch (tier) {
    case 'hot':
      return 'Open';
    case 'warm':
      return 'Warming up';
    case 'cold':
      return 'Guarded';
  }
};

export const HeatMeter: React.FC<HeatMeterProps> = ({ value, variant = 'default', className }) => {
  const v = clamp(Number.isFinite(value) ? value : 0, 0, 100);
  const tier = getTier(v);

  const gradient =
    tier === 'hot'
      ? 'from-red-600 via-orange-500 to-yellow-400'
      : tier === 'warm'
        ? 'from-pink-500/80 via-pink-400/70 to-pink-300/60'
        : 'from-dark-700 via-dark-600 to-dark-500';

  const glow =
    tier === 'hot'
      ? 'shadow-orange-500/50 shadow-red-500/30'
      : tier === 'warm'
        ? 'shadow-pink-500/15'
        : 'shadow-black/20';

  if (variant === 'embedded') {
    const baseClass =
      'h-full w-[64px] rounded-[28px] border border-white/10 bg-black/20 backdrop-blur-md shadow-xl shadow-black/30';
    return (
      <div
        className={className ? `${baseClass} ${className}` : baseClass}
      >
        <div className="h-full flex flex-col items-center py-4">
          <div
            className={
              tier === 'hot'
                ? 'text-[11px] font-semibold text-pink-200'
                : tier === 'warm'
                  ? 'text-[11px] font-semibold text-pink-200/80'
                  : 'text-[11px] font-semibold text-dark-200/70'
            }
          >
            {getTierLabel(tier)}
          </div>

          <div
            className={
              tier === 'hot'
                ? 'mt-1 text-[12px] font-bold text-pink-100 tabular-nums'
                : tier === 'warm'
                  ? 'mt-1 text-[12px] font-bold text-pink-100/90 tabular-nums'
                  : 'mt-1 text-[12px] font-bold text-dark-100/80 tabular-nums'
            }
          >
            {Math.round(v)}
          </div>

          <div className="mt-4 w-4 flex-1 relative rounded-full border border-white/10 bg-gradient-to-b from-dark-950/35 to-dark-800/15 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 via-transparent to-transparent" />

            <motion.div
              className={`absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t ${gradient} shadow-2xl ${glow}`}
              initial={false}
              animate={{ 
                height: `${v}%`,
                filter: tier === 'hot' && v >= 90 ? ['hue-rotate(0deg)', 'hue-rotate(20deg)', 'hue-rotate(0deg)'] : 'hue-rotate(0deg)'
              }}
              transition={{ 
                height: { type: 'spring', stiffness: 140, damping: 22 },
                filter: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              }}
            />

            {tier === 'hot' && (
              <>
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={false}
                  animate={{ opacity: [0.3, 0.8, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    background:
                      'radial-gradient(closest-side, rgba(251,146,60,0.4), rgba(239,68,68,0.3), rgba(0,0,0,0) 70%)',
                  }}
                />
                <motion.div
                  className="absolute -inset-8 pointer-events-none blur-3xl"
                  initial={false}
                  animate={{ 
                    opacity: [0.4, 0.9, 0.5], 
                    scale: [0.95, 1.1, 1.0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    background:
                      'conic-gradient(from 0deg, rgba(251,146,60,0.2), rgba(239,68,68,0.6), rgba(245,158,11,0.4), rgba(251,146,60,0.2))',
                  }}
                />
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={false}
                  animate={{ 
                    boxShadow: [
                      'inset 0 0 20px rgba(251,146,60,0.8)',
                      'inset 0 0 40px rgba(239,68,68,0.6)',
                      'inset 0 0 20px rgba(245,158,11,0.8)'
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </>
            )}

            <motion.div
              className="absolute bottom-0 left-0 right-0 h-[18%] opacity-70 blur-xl pointer-events-none"
              initial={false}
              animate={{
                background:
                  tier === 'hot'
                    ? 'radial-gradient(closest-side, rgba(236,72,153,0.55), rgba(0,0,0,0))'
                    : tier === 'warm'
                      ? 'radial-gradient(closest-side, rgba(236,72,153,0.30), rgba(0,0,0,0))'
                      : 'radial-gradient(closest-side, rgba(17,24,39,0.25), rgba(0,0,0,0))',
              }}
              transition={{ duration: 0.35 }}
            />
          </div>

          <div className="mt-4 text-[10px] text-dark-200/50 font-semibold tracking-wide">HEAT</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        className ||
        'w-full rounded-3xl border border-pink-500/15 bg-dark-900/30 backdrop-blur-md shadow-xl shadow-black/30'
      }
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold tracking-wide text-pink-200/80">HEAT</div>
            <div className="text-[11px] text-dark-300 mt-1">Openness</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-white tabular-nums">{Math.round(v)}%</div>
            <div
              className={
                tier === 'hot'
                  ? 'text-[11px] text-pink-200'
                  : tier === 'warm'
                    ? 'text-[11px] text-pink-200/80'
                    : 'text-[11px] text-dark-300'
              }
            >
              {getTierLabel(tier)}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <div className="relative h-[260px] w-12 rounded-3xl border border-white/10 bg-gradient-to-b from-dark-950/50 to-dark-800/30 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 via-transparent to-transparent" />

            <motion.div
              className={`absolute bottom-0 left-0 right-0 rounded-3xl bg-gradient-to-t ${gradient} shadow-2xl ${glow}`}
              initial={false}
              animate={{ 
                height: `${v}%`,
                filter: tier === 'hot' && v >= 90 ? ['hue-rotate(0deg)', 'hue-rotate(20deg)', 'hue-rotate(0deg)'] : 'hue-rotate(0deg)'
              }}
              transition={{ 
                height: { type: 'spring', stiffness: 140, damping: 22 },
                filter: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              }}
            />

            {tier === 'hot' && (
              <>
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={false}
                  animate={{ opacity: [0.3, 0.8, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    background:
                      'radial-gradient(closest-side, rgba(251,146,60,0.4), rgba(239,68,68,0.3), rgba(0,0,0,0) 70%)',
                  }}
                />
                <motion.div
                  className="absolute -inset-8 pointer-events-none blur-3xl"
                  initial={false}
                  animate={{ 
                    opacity: [0.4, 0.9, 0.5], 
                    scale: [0.95, 1.1, 1.0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    background:
                      'conic-gradient(from 0deg, rgba(251,146,60,0.2), rgba(239,68,68,0.6), rgba(245,158,11,0.4), rgba(251,146,60,0.2))',
                  }}
                />
              </>
            )}

            <motion.div
              className="absolute bottom-0 left-0 right-0 h-[18%] opacity-70 blur-xl pointer-events-none"
              initial={false}
              animate={{
                background:
                  tier === 'hot'
                    ? 'radial-gradient(closest-side, rgba(239,68,68,0.8), rgba(251,146,60,0.6), rgba(0,0,0,0))'
                    : tier === 'warm'
                      ? 'radial-gradient(closest-side, rgba(236,72,153,0.30), rgba(0,0,0,0))'
                      : 'radial-gradient(closest-side, rgba(17,24,39,0.25), rgba(0,0,0,0))',
              }}
              transition={{ duration: 0.35 }}
            />

            <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none">
              <div className="w-full flex justify-center">
                <span className="text-[10px] text-dark-300/80">100</span>
              </div>
              <div className="w-full flex justify-center">
                <span className="text-[10px] text-dark-300/80">0</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-dark-950/30 px-3 py-2">
          <div className="text-[11px] text-dark-300 leading-snug">
            Higher heat means she is more receptive. Low heat means she will set boundaries.
          </div>
        </div>
      </div>
    </div>
  );
};
