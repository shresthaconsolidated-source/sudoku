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
    
    await supabase.from('game_state').insert({
      room_id: room.id,
      current_grid: puzzle?.initial_grid || {},
      start_time: new Date().toISOString()
    })

    // Update room status to trigger navigation for everyone
    await supabase.from('rooms').update({ status: 'active' }).eq('id', room.id)
    
    // Note: Router push is handled by the realtime subscription above
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Room: {room.id}</h1>
        <p className="text-muted-foreground text-lg">Difficulty: <span className="font-semibold text-primary">{room.difficulty}</span></p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Host Card */}
        <Card className="border-4 border-blue-500 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">HOST</div>
          <CardHeader className="text-center pb-2">
            <CardTitle>Player 1</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden mb-4 border-2 border-blue-200">
              {room.host.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={room.host.avatar_url} alt="Host Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-slate-400">{room.host.first_name?.[0] || 'H'}</span>
              )}
            </div>
            <h3 className="text-xl font-bold">{room.host.first_name || 'Player'}</h3>
            {isHost && <p className="text-sm text-blue-500 mt-1 font-medium">(You)</p>}
          </CardContent>
        </Card>

        {/* Joiner Card */}
        <Card className={`border-4 border-dashed shadow-md transition-all duration-300 ${hasJoiner ? 'border-primary border-solid bg-white' : 'border-slate-200 bg-slate-50'}`}>
          <CardHeader className="text-center pb-2">
            <CardTitle>{hasJoiner ? 'Player 2' : 'Waiting...'}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 h-[200px]">
            {hasJoiner ? (
              <>
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden mb-4 border-2 border-primary">
                  {room.joiner!.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={room.joiner!.avatar_url} alt="Joiner Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-slate-400">{room.joiner!.first_name?.[0] || 'J'}</span>
                  )}
                </div>
                <h3 className="text-xl font-bold">{room.joiner!.first_name || 'Player'}</h3>
                {!isHost && <p className="text-sm text-slate-500 mt-1 font-medium">(You)</p>}
              </>
            ) : (
              <Loader2 className="h-10 w-10 text-slate-300 animate-spin" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
         <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
           {isHost ? (
             <>
               <Button onClick={copyLink} variant="outline" className="w-full md:w-auto font-mono text-sm h-12">
                 <Copy className="mr-2 h-4 w-4" />
                 {copied ? 'Copied Link!' : inviteLink}
               </Button>
               <Button 
                 onClick={handleStartGame} 
                 className="w-full md:w-auto h-12 px-8 text-lg font-bold"
                 disabled={starting}
               >
                 {starting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" fill="currentColor" />}
                 {hasJoiner ? 'Start Match' : 'Start Solo'}
               </Button>
             </>
           ) : (
             <div className="text-center w-full py-2">
               <p className="text-lg font-medium text-slate-600 flex items-center justify-center gap-2">
                 <Loader2 className="h-5 w-5 animate-spin" />
                 Waiting for Host to start the game...
               </p>
             </div>
           )}
         </CardContent>
      </Card>
    </div>
  )
}
