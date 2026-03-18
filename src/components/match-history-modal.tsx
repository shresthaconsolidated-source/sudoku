'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trophy, Clock, AlertTriangle } from 'lucide-react'

export default function MatchHistoryModal({ children, userId }: { children: React.ReactElement, userId: string }) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchHistory() {
      const { data: profile } = await supabase.from('users').select('first_name').eq('id', userId).single()
      const myName = profile?.first_name

      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(20)

      if (data && myName) {
        setHistory(data.filter(entry => entry.player_names.includes(myName)))
      }
      setLoading(false)
    }

    if (userId) fetchHistory()
  }, [userId, supabase])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(dateStr))
  }

  return (
    <Dialog>
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-[500px] bg-[#0A0A0A]/95 backdrop-blur-2xl border-white/10 text-white rounded-[3rem] p-8 shadow-2xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-3xl font-black tracking-tighter flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
            MATCH HISTORY
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-12">
               <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center p-10 bg-white/5 rounded-3xl border border-dashed border-white/10">
               <p className="text-slate-500 font-bold">No completed battles yet.</p>
               <p className="text-xs text-slate-600 mt-2 italic text-balance">Master the grid to see your victories here!</p>
            </div>
          ) : (
            history.map((match, idx) => (
              <div key={match.id} className="group relative bg-white/5 border border-white/10 rounded-3xl p-5 hover:bg-white/10 transition-all hover:border-primary/30">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      {formatDate(match.completed_at)}
                    </p>
                    <h4 className="text-lg font-black tracking-tight text-white uppercase italic">
                      {match.player_names.join(' & ')}
                    </h4>
                  </div>
                  <div className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                    #{idx + 1} Best
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-2 bg-black/40 rounded-xl p-2 px-3 border border-white/5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-black text-slate-300 tabular-nums">{formatTime(match.time_taken_seconds)}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 rounded-xl p-2 px-3 border border-white/5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs font-black text-slate-300 tabular-nums">{match.mistakes || 0} Mistakes</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
