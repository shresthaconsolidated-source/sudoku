import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Swords, Zap, Users } from 'lucide-react'
import Link from 'next/link'
import JoinRoomForm from './join-room-form'

import RankBadge from '@/components/ui/rank-badge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch user stats
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Welcome back, <span className="text-primary">{profile?.first_name || 'Player'}</span>!
          </h1>
          <p className="text-slate-400 font-medium text-lg">
            Master the grid. Dominate the leaderboard.
          </p>
        </div>
        <RankBadge mmr={profile?.mmr || 1000} className="scale-125 origin-left md:origin-right" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: 'Total Completed', value: profile?.total_completed || 0, icon: Trophy, color: 'text-yellow-400' },
          { label: 'Win Rate', value: `${profile?.win_rate || '0'}%`, icon: Zap, color: 'text-primary' },
          { label: 'MMR Rating', value: profile?.mmr || 1000, icon: Swords, color: 'text-secondary' },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold tracking-wider uppercase text-slate-400">{stat.label}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color} drop-shadow-[0_0_8px_currentColor]`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 pt-4">
        <Card className="bg-card/40 backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden hover:border-primary/50 transition-all group shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-extrabold text-white">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 group-hover:scale-110 transition-transform">
                <Swords className="h-6 w-6 text-primary" />
              </div>
              Host a Battle
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium text-base">
              Create a new room and challenge a friend in a real-time race. 
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/host" className="w-full">
              <Button className="w-full bg-primary hover:bg-primary/90 text-black font-black h-14 text-lg rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
                START NEW ARENA
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden hover:border-secondary/50 transition-all group shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-extrabold text-white">
              <div className="p-2 rounded-xl bg-secondary/10 border border-secondary/20 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              Join Arena
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium text-base">
              Got a secret invite code? Enter it here to enter the battle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JoinRoomForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
