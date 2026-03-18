'use client'

import { motion } from 'framer-motion'
import { Brain, Flame, Skull, Zap, ChevronLeft, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const DIFFICULTIES = [
  { 
    name: 'Easy', 
    icon: Brain, 
    color: 'text-emerald-400', 
    glow: 'shadow-emerald-500/20',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/5',
    description: 'Perfect for a warm-up or casual play.' 
  },
  { 
    name: 'Medium', 
    icon: Zap, 
    color: 'text-blue-400', 
    glow: 'shadow-blue-500/20',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/5',
    description: 'A solid challenge for seasoned solvers.' 
  },
  { 
    name: 'Hard', 
    icon: Flame, 
    color: 'text-amber-400', 
    glow: 'shadow-amber-500/20',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    description: 'Requires advanced techniques and focus.' 
  },
  { 
    name: 'Extreme', 
    icon: Skull, 
    color: 'text-rose-500', 
    glow: 'shadow-rose-600/30',
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/5',
    description: 'Only for the true masters of the grid.' 
  },
]

export default function HostClient() {
  return (
    <div className="flex flex-col items-center py-12 px-6">
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Match Configuration</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-4">
            Initialize <span className="text-primary italic">Battle</span>
          </h1>
          <p className="text-slate-400 font-bold max-w-md mx-auto">
            Choose your challenge level. We will pair you with a high-fidelity puzzle and open a dedicated arena.
          </p>
        </motion.div>

        {/* Difficulty Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {DIFFICULTIES.map((diff, i) => (
            <motion.form 
              key={diff.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              action="/api/rooms/create"
              method="post"
              className="w-full"
            >
              <input type="hidden" name="difficulty" value={diff.name} />
              <button 
                type="submit" 
                className="group relative w-full text-left bg-white/[0.03] backdrop-blur-2xl border-2 border-white/5 p-8 rounded-[2.5rem] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 shadow-2xl overflow-hidden"
              >
                {/* Subtle internal gradient glow */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 ${diff.bg} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative z-10 flex items-start justify-between mb-8">
                  <div className={`p-4 rounded-2xl ${diff.bg} border ${diff.border} shadow-lg ${diff.glow}`}>
                    <diff.icon className={`w-8 h-8 ${diff.color}`} />
                  </div>
                  <ChevronLeft className="w-6 h-6 text-white/20 -rotate-180 group-hover:translate-x-1 transition-transform" />
                </div>

                <div className="relative z-10">
                  <h3 className="text-3xl font-black tracking-tight mb-2 group-hover:text-primary transition-colors">{diff.name}</h3>
                  <p className="text-slate-500 font-bold text-sm leading-relaxed">{diff.description}</p>
                </div>

                {/* Hover decorative bar */}
                <div className={`absolute bottom-0 left-0 h-1 bg-primary w-0 group-hover:w-full transition-all duration-500`} />
              </button>
            </motion.form>
          ))}
        </div>

        {/* Action Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <Link href="/dashboard">
            <Button variant="ghost" className="text-slate-500 hover:text-white font-black uppercase tracking-[0.2em] text-xs gap-3">
              <ChevronLeft className="w-4 h-4" />
              Abort mission & Return
            </Button>
          </Link>
        </motion.div>

      </div>

    </div>
  )
}
