import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Zap, Activity, Clock, Medal } from 'lucide-react'

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

  // 3. Fetch Recent Completed Games (from leaderboard where they are in player_names)
  // Since player_names is text[], we use the contains operator @>
  const { data: recentGames } = await supabase
    .from('leaderboard')
    .select('*, puzzle:puzzles(id, difficulty)')
    .contains('player_names', [profile?.first_name])
    .order('completed_at', { ascending: false })
    .limit(5)

  // 4. Determine "Top 3" placement logic.
  // Real implementation requires complex ranking SQL query. 
  // For UI MVP, we'll fetch fastest times this player has and assume they are top records.
  const { data: topRecords } = await supabase
    .from('leaderboard')
    .select('*, puzzle:puzzles(id, difficulty)')
    .contains('player_names', [profile?.first_name])
    .order('time_taken_seconds', { ascending: true })
    .limit(3)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <Navbar />
       
       <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
         
         {/* Top Section - Profile Overview */}
         <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
           <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-100 rounded-full border-4 border-white shadow-md flex items-center justify-center text-blue-700 text-4xl md:text-5xl font-bold overflow-hidden">
             {profile?.avatar_url ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
               profile?.first_name?.[0] || 'P'
             )}
           </div>
           
           <div className="text-center md:text-left flex-1">
             <h1 className="text-3xl font-bold tracking-tight text-slate-900">{profile?.first_name || 'Player'}</h1>
             <p className="text-slate-500 mt-1 mb-4 flex items-center justify-center md:justify-start gap-2">
               <Activity className="w-4 h-4" /> Member since {new Date(profile?.created_at).toLocaleDateString()}
             </p>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Trophy className="w-3 h-3"/> Completed</p>
                  <p className="text-2xl font-bold text-slate-800">{profile?.total_completed || 0}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Zap className="w-3 h-3"/> Win Rate</p>
                  <p className="text-2xl font-bold text-slate-800">{profile?.win_rate || '0'}%</p>
                </div>
             </div>
           </div>
         </div>

         {/* Grid Layout for Details */}
         <div className="grid md:grid-cols-2 gap-8">
            
            {/* Top Records Section */}
            <Card className="border-t-4 border-t-yellow-400">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="w-5 h-5 text-yellow-500" /> Personal Bests
                </CardTitle>
                <CardDescription>Your fastest completion times</CardDescription>
              </CardHeader>
              <CardContent>
                {topRecords && topRecords.length > 0 ? (
                  <div className="space-y-3">
                    {topRecords.map((record, idx) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-yellow-200 transition-colors">
                         <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'}`}>
                             #{idx + 1}
                           </div>
                           <div>
                             <p className="font-semibold text-slate-800">{record.puzzle?.difficulty} Puzzle #{record.puzzle_id}</p>
                             <p className="text-xs text-slate-500 line-clamp-1">with {record.player_names.join(' & ')}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-1 text-slate-700 font-mono font-bold bg-white px-2 py-1 flex items-center justify-center font-bold text-sm bg-yellow-100 text-yellow-700 rounded shadow-sm">
                           <Clock className="w-3 h-3" />
                           {formatTime(record.time_taken_seconds)}
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Medal className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p>No records yet. Play your first game!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-t-4 border-t-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" /> Recent Activity
                </CardTitle>
                <CardDescription>Your latest sequential puzzles</CardDescription>
              </CardHeader>
              <CardContent>
                {recentGames && recentGames.length > 0 ? (
                  <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {recentGames.map((game, i) => (
                      <div key={game.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-3">
                        {/* Timeline dot */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-blue-50 group-[.is-active]:text-blue-500 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mx-auto">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        
                        {/* Content */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                           <div className="flex justify-between items-start mb-1">
                             <span className="font-bold text-sm text-blue-600">{game.puzzle?.difficulty}</span>
                             <span className="text-xs text-slate-400">{new Date(game.completed_at).toLocaleDateString()}</span>
                           </div>
                           <p className="text-slate-700 font-medium text-sm">Puzzle #{game.puzzle_id}</p>
                           <p className="text-xs text-slate-500 mt-2 font-mono">{formatTime(game.time_taken_seconds)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>No recent activity.</p>
                  </div>
                )}
              </CardContent>
            </Card>

         </div>
       </main>
    </div>
  )
}

function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  )
}
