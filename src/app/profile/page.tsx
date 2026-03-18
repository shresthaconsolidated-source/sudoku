import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Zap, Activity, Clock, Medal, Check } from 'lucide-react'
import RankBadge from '@/components/ui/rank-badge'

// Basic time formatter
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default async function ProfilePage() {
  const supabase = await createClient()

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // 2. Fetch User Profile Stats
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // 3. Fetch Recent Completed Games
  const { data: recentGames } = await supabase
    .from('leaderboard')
    .select('*, puzzle:puzzles(id, difficulty)')
    .contains('player_names', [profile?.first_name])
    .order('completed_at', { ascending: false })
    .limit(5)

  // 4. Determine "Top 3" placement logic
  const { data: topRecords } = await supabase
    .from('leaderboard')
    .select('*, puzzle:puzzles(id, difficulty)')
    .contains('player_names', [profile?.first_name])
    .order('time_taken_seconds', { ascending: true })
    .limit(3)

  return (
    <div className="min-h-screen bg-background flex flex-col">
       <Navbar />
       
       <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
         
         {/* Top Section - Profile Overview */}
         <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-card/40 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50" />
            
            <div className="relative z-10 w-24 h-24 md:w-40 md:h-40 bg-white/5 rounded-full border-4 border-white/10 shadow-2xl flex items-center justify-center text-primary text-5xl md:text-7xl font-black overflow-hidden group-hover:scale-105 transition-transform duration-500">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.first_name?.[0] || 'P'
              )}
            </div>
            
            <div className="relative z-10 text-center md:text-left flex-1 space-y-4">
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">{profile?.first_name || 'Player'}</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center md:justify-start gap-2">
                  <Activity className="w-3 h-3 text-primary" /> Member since {new Date(profile?.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex justify-center md:justify-start">
                <RankBadge mmr={profile?.mmr || 1000} className="scale-125 origin-center md:origin-left" />
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                 {[
                   { label: 'Completed', value: profile?.total_completed || 0, icon: Trophy, color: 'text-yellow-400' },
                   { label: 'Win Rate', value: `${profile?.win_rate || '0'}%`, icon: Zap, color: 'text-primary' },
                   { label: 'Skill Rating', value: profile?.mmr || 1000, icon: Medal, color: 'text-secondary' },
                 ].map((stat, i) => (
                   <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner group/stat hover:bg-white/10 transition-colors">
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                       <stat.icon className={`w-3 h-3 ${stat.color} drop-shadow-[0_0_5px_currentColor]`} /> {stat.label}
                     </p>
                     <p className="text-2xl font-black text-white">{stat.value}</p>
                   </div>
                 ))}
              </div>
            </div>
         </div>

         {/* Grid Layout for Details */}
         <div className="grid md:grid-cols-2 gap-10 pb-20">
            
            {/* Top Records Section */}
            <Card className="bg-card/40 backdrop-blur-lg border border-white/10 rounded-[2rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500" />
              <CardHeader className="p-8">
                <CardTitle className="flex items-center gap-3 text-2xl font-black italic tracking-tighter text-white uppercase">
                  <Medal className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" /> Personal Bests
                </CardTitle>
                <CardDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Fastest board clears</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                {topRecords && topRecords.length > 0 ? (
                  <div className="space-y-4">
                    {topRecords.map((record, idx) => (
                      <div key={record.id} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all hover:scale-[1.02] group/rec shadow-xl">
                         <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${idx === 0 ? 'bg-yellow-100 text-yellow-700 shadow-[0_0_15px_rgba(254,240,138,0.3)]' : idx === 1 ? 'bg-slate-200 text-slate-700 shadow-[0_0_15px_rgba(226,232,240,0.3)]' : 'bg-orange-100 text-orange-700 shadow-[0_0_15px_rgba(255,edd,213,0.3)]'}`}>
                             {idx + 1}
                           </div>
                           <div>
                             <p className="font-black text-white text-sm tracking-tight">{record.puzzle?.difficulty} Puzzle #{record.puzzle_id}</p>
                             <p className="text-[10px] text-slate-500 font-bold uppercase">{record.player_names.join(' & ')}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-2 text-primary font-black bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 shadow-lg tabular-nums">
                           <Clock className="w-4 h-4" />
                           {formatTime(record.time_taken_seconds)}
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-600">
                    <Medal className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p className="font-bold text-sm uppercase tracking-widest">No records yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-card/40 backdrop-blur-lg border border-white/10 rounded-[2rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              <CardHeader className="p-8">
                <CardTitle className="flex items-center gap-3 text-2xl font-black italic tracking-tighter text-white uppercase">
                  <Activity className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" /> Real-time History
                </CardTitle>
                <CardDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Latest battlefield completions</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                {recentGames && recentGames.length > 0 ? (
                  <div className="space-y-6">
                    {recentGames.map((game) => (
                      <div key={game.id} className="flex items-center gap-6 group/item">
                         <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform shadow-[0_0_15px_rgba(0,229,255,0.1)] shrink-0">
                           <Check className="w-5 h-5" />
                         </div>
                         <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors shadow-lg">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-black text-xs text-primary tracking-tighter uppercase">{game.puzzle?.difficulty}</span>
                              <span className="text-[10px] text-slate-500 font-bold">{new Date(game.completed_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-end">
                              <p className="text-white font-black tracking-tight text-sm">Puzzle #{game.puzzle_id}</p>
                              <p className="text-slate-400 font-black text-xs italic tabular-nums">{formatTime(game.time_taken_seconds)}</p>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-600">
                    <p className="font-bold text-sm uppercase tracking-widest">Quiet battlefield</p>
                  </div>
                )}
              </CardContent>
            </Card>
         </div>
       </main>
    </div>
  )
}
