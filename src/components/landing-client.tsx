'use client'

import { motion } from 'framer-motion'
import { Grid3X3, Swords, Trophy, Zap, Shield, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const features = [
  {
    title: 'Real-time Presence',
    description: 'See opponent cursors and board progress live as you compete.',
    icon: Swords,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10'
  },
  {
    title: 'Ranking System',
    description: 'Earn MMR for victories and climb from Bronze to Grandmaster.',
    icon: Trophy,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10'
  },
  {
    title: 'Premium Aesthetic',
    description: 'Exquisite glassmorphic UI designed for deep focus and flow.',
    icon: Sparkles,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10'
  }
]

export default function LandingClient() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-primary/30 relative overflow-hidden flex flex-col items-center">
      
      {/* Background Blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-40 -right-20 w-[500px] h-[500px] bg-secondary/10 blur-[150px] rounded-full -z-10" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Hero Section */}
      <main className="relative z-10 w-full max-w-5xl px-6 pt-32 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center gap-3 mb-8 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Competitive Beta Live</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-8">
            Master the Grid. <br />
            <span className="bg-gradient-to-r from-primary via-white to-secondary bg-clip-text text-transparent italic drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              Together.
            </span>
          </h1>

          <p className="max-w-xl text-lg md:text-xl text-slate-400 font-bold leading-relaxed mb-12">
            The world's first competitive multiplayer Sudoku platform with real-time presence and MMR rankings.
          </p>

          <div className="flex flex-col sm:flex-row gap-6">
            <Link href="/auth/google">
              <Button className="h-16 px-10 bg-white hover:bg-slate-100 text-black font-black text-xl rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-4">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Connect with Google
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Feature Section */}
      <section className="relative z-10 w-full max-w-5xl px-6 pb-32">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.05] transition-colors group"
            >
              <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-8 border border-white/5`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-black mb-4 group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-slate-400 font-bold text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Decorative Board Preview */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ delay: 0.8, duration: 2 }}
        className="w-full max-w-4xl opacity-10 pointer-events-none mb-20"
      >
         <div className="grid grid-cols-9 aspect-square border-4 border-white/20 bg-white/5 rounded-3xl overflow-hidden p-2 gap-1">
            {Array.from({ length: 81 }).map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/5 rounded-md flex items-center justify-center font-black text-white/40 italic">
                {Math.random() > 0.7 ? Math.floor(Math.random() * 9) + 1 : ''}
              </div>
            ))}
         </div>
      </motion.div>

      {/* Footer */}
      <footer className="relative z-10 w-full py-12 border-t border-white/5 text-center px-6">
        <div className="flex justify-center items-center gap-4 mb-4">
           <Grid3X3 className="w-5 h-5 text-primary" />
           <span className="font-extrabold tracking-tighter text-lg">SUDOKU MULTI <span className="text-xs text-slate-500 ml-1">V2</span></span>
        </div>
        <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">&copy; 2026 Crafted by Antigravity. All rights reserved.</p>
      </footer>

    </div>
  )
}
