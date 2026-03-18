'use client'

import { motion } from 'framer-motion'
import { Trophy, Shield, Zap, Star, Crown } from 'lucide-react'

export type RankTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Grandmaster'

export const getRank = (mmr: number): RankTier => {
  if (mmr < 1100) return 'Bronze'
  if (mmr < 1300) return 'Silver'
  if (mmr < 1600) return 'Gold'
  if (mmr < 2000) return 'Platinum'
  if (mmr < 2500) return 'Diamond'
  return 'Grandmaster'
}

const rankConfig: Record<RankTier, { color: string, icon: any, label: string, shadow: string }> = {
  Bronze: { color: 'text-orange-400', icon: Shield, label: 'Bronze', shadow: 'shadow-orange-500/20' },
  Silver: { color: 'text-slate-300', icon: Zap, label: 'Silver', shadow: 'shadow-slate-400/20' },
  Gold: { color: 'text-yellow-400', icon: Star, label: 'Gold', shadow: 'shadow-yellow-500/20' },
  Platinum: { color: 'text-cyan-400', icon: Trophy, label: 'Platinum', shadow: 'shadow-cyan-400/20' },
  Diamond: { color: 'text-indigo-400', icon: Crown, label: 'Diamond', shadow: 'shadow-indigo-500/20' },
  Grandmaster: { color: 'text-rose-500', icon: Crown, label: 'Grandmaster', shadow: 'shadow-rose-500/30' },
}

export default function RankBadge({ mmr, className = "" }: { mmr: number, className?: string }) {
  const tier = getRank(mmr)
  const config = rankConfig[tier]
  const Icon = config.icon

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 ${config.shadow} ${className}`}
    >
      <Icon className={`w-4 h-4 ${config.color} drop-shadow-[0_0_8px_currentColor]`} />
      <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>
        {config.label} <span className="text-white/40 ml-1">{mmr}</span>
      </span>
    </motion.div>
  )
}
