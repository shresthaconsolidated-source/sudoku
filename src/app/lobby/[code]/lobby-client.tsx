'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Play, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UserDisplay {
  id: string
  first_name: string | null
  avatar_url: string | null
}

interface RoomData {
  id: string
  host_id: string
  joiner_id: string | null
  puzzle_id: number
  difficulty: string
  status: string
  host: UserDisplay
  joiner: UserDisplay | null
}

export default function LobbyClient({ initialRoom, currentUser }: { initialRoom: RoomData, currentUser: string }) {
  const [room, setRoom] = useState(initialRoom)
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const isHost = currentUser === room.host_id
  const hasJoiner = !!room.joiner_id
  const [inviteLink, setInviteLink] = useState('')

  useEffect(() => {
    setInviteLink(`${window.location.host}/lobby/${room.id}`)
  }, [room.id])

  useEffect(() => {
    // Subscribe to realtime changes on this room
    const channel = supabase
      .channel(`room_${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${room.id}`,
        },
        async (payload) => {
          const updatedRoom = payload.new as any

          // If game started, redirect!
          if (updatedRoom.status === 'active') {
             router.push(`/game/${room.id}`)
             return
          }

          // If joiner changed, we need to fetch the joiner's profile to display it
          if (updatedRoom.joiner_id && !room.joiner_id) {
             const { data: joinerProfile } = await supabase
               .from('users')
               .select('id, first_name, avatar_url')
               .eq('id', updatedRoom.joiner_id)
               .single()
               
             setRoom(prev => ({
               ...prev,
               ...updatedRoom,
               joiner: joinerProfile
             }))
          } else {
             setRoom(prev => ({ ...prev, ...updatedRoom }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room.id, router, supabase, room.joiner_id])

  // Redirect immediately if already active
  useEffect(() => {
    if (room.status === 'active') {
       router.push(`/game/${room.id}`)
    }
  }, [room.status, room.id, router])

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStartGame = async () => {
    setStarting(true)
    
    // Create initial game state row
    const { data: puzzle } = await supabase.from('puzzles').select('initial_grid').eq('id', room.puzzle_id).single()
    
    const mappedGrid = puzzle?.initial_grid?.map((row: any[]) => 
      row.map(val => ({ 
        value: val, 
        notes: [], 
        isGiven: val !== null, 
        isError: false,
        filled_by: val !== null ? room.host_id : null // Given numbers belong to the host/system
      }))
    ) || []

    await Promise.all([
      supabase.from('game_state').insert({
        room_id: room.id,
        current_grid: mappedGrid,
        mistakes_count: 0,
        start_time: new Date().toISOString()
      }),
      supabase.rpc('increment_started', { target_user_id: room.host_id })
    ])

    if (room.joiner_id) {
      await supabase.rpc('increment_started', { target_user_id: room.joiner_id })
    }

    // Update room status to trigger navigation for everyone
    await supabase.from('rooms').update({ status: 'active' }).eq('id', room.id)
    
    // Note: Router push is handled by the realtime subscription above
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-1000">
      <div className="text-center mb-12">
        <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-black tracking-widest text-xs mb-4 uppercase shadow-[0_0_15px_rgba(0,229,255,0.1)]">
          BATTLE ARENA
        </div>
        <h1 className="text-6xl font-black tracking-tighter text-white mb-3">Room: {room.id}</h1>
        <div className="flex items-center justify-center gap-3">
           <span className="h-px w-8 bg-white/10" />
           <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
             DIFFICULTY: <span className="text-primary drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">{room.difficulty}</span>
           </p>
           <span className="h-px w-8 bg-white/10" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-10 mb-12">
        {/* Host Card */}
        <Card className="bg-card/40 backdrop-blur-xl border-4 border-primary/50 shadow-2xl shadow-primary/10 relative overflow-hidden rounded-[2.5rem] group transition-transform hover:scale-[1.02]">
          <div className="absolute top-0 right-0 bg-primary text-black text-xs font-black px-5 py-1.5 rounded-bl-2xl shadow-lg">HOST</div>
          <CardHeader className="text-center pb-2 pt-10">
            <CardTitle className="text-slate-400 font-black tracking-widest uppercase text-xs">Player One</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden mb-6 border-4 border-primary/20 shadow-[0_0_30px_rgba(0,229,255,0.2)] group-hover:shadow-primary/40 transition-all duration-500">
              {room.host.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={room.host.avatar_url} alt="Host Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-slate-600">{room.host.first_name?.[0] || 'H'}</span>
              )}
            </div>
            <h3 className="text-2xl font-black text-white">{room.host.first_name || 'Player'}</h3>
            {isHost && <p className="text-sm text-primary mt-2 font-bold tracking-tight uppercase px-3 py-1 bg-primary/10 rounded-lg">YOU</p>}
          </CardContent>
        </Card>

        {/* Joiner Card */}
        <Card className={`backdrop-blur-xl border-4 shadow-2xl relative overflow-hidden rounded-[2.5rem] group transition-all duration-500 hover:scale-[1.02] ${hasJoiner ? 'border-secondary/50 bg-card/40 shadow-secondary/10' : 'border-dashed border-white/10 bg-white/5'}`}>
          {hasJoiner && <div className="absolute top-0 right-0 bg-secondary text-white text-xs font-black px-5 py-1.5 rounded-bl-2xl shadow-lg">CHALLENGER</div>}
          <CardHeader className="text-center pb-2 pt-10">
            <CardTitle className="text-slate-400 font-black tracking-widest uppercase text-xs">{hasJoiner ? 'Player Two' : 'Awaiting Rival...'}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 h-[240px]">
            {hasJoiner ? (
              <>
                <div className="w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden mb-6 border-4 border-secondary/20 shadow-[0_0_30px_rgba(255,0,85,0.2)] group-hover:shadow-secondary/40 transition-all duration-500">
                  {room.joiner!.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={room.joiner!.avatar_url} alt="Joiner Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-slate-600">{room.joiner!.first_name?.[0] || 'J'}</span>
                  )}
                </div>
                <h3 className="text-2xl font-black text-white">{room.joiner!.first_name || 'Player'}</h3>
                {!isHost && <p className="text-sm text-secondary mt-2 font-bold tracking-tight uppercase px-3 py-1 bg-secondary/10 rounded-lg">YOU</p>}
              </>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-14 w-14 text-slate-700 animate-[spin_3s_linear_infinite]" />
                <p className="text-slate-600 font-bold uppercase tracking-widest text-xs animate-pulse">Waiting for entry...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
         <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
           {isHost ? (
             <>
               <Button onClick={copyLink} variant="outline" className="w-full md:w-auto font-mono text-sm h-14 rounded-2xl border-white/10 bg-black/40 hover:bg-black/60 text-slate-300 transition-all px-6">
                 <Copy className="mr-3 h-4 w-4" />
                 {copied ? 'COPIED TO CLIPBOARD!' : `INVITE: ${inviteLink}`}
               </Button>
               <Button 
                 onClick={handleStartGame} 
                 className="w-full md:w-auto h-14 px-12 text-xl font-black rounded-2xl bg-primary hover:bg-primary/90 text-black shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                 disabled={starting}
               >
                 {starting ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Play className="mr-3 h-6 w-6" fill="currentColor" />}
                 {hasJoiner ? 'INITIALIZE BATTLE' : 'START SOLO RUN'}
               </Button>
             </>
           ) : (
             <div className="text-center w-full py-4">
               <div className="flex items-center justify-center gap-4 text-2xl font-black text-white tracking-tight">
                 <Loader2 className="h-8 w-8 text-primary animate-spin" />
                 WAITING FOR HOST TO COMMENCE...
               </div>
             </div>
           )}
         </CardContent>
      </Card>
    </div>
  )
}
