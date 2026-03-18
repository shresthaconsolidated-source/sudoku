import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import GameClient from './game-client'
import Navbar from '@/components/navbar'

export default async function GamePage(props: { params: Promise<{ room_id: string }> }) {
  const params = await props.params;
  const roomId = params.room_id
  const supabase = await createClient()

  // 1. Check Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/?next=/game/${roomId}`)
  }

  // 2. Fetch Room & Game State
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select(`
      *,
      host:users!rooms_host_id_fkey(id, first_name, avatar_url),
      joiner:users!rooms_joiner_id_fkey(id, first_name, avatar_url),
      puzzle:puzzles!rooms_puzzle_id_fkey(*)
    `)
    .eq('id', roomId)
    .single()

  if (roomError || !room) {
    redirect('/dashboard')
  }

  // Ensure user is actually in this room
  if (user.id !== room.host_id && user.id !== room.joiner_id) {
    redirect('/dashboard') // Or specific error page
  }

  const { data: gameState } = await supabase
    .from('game_state')
    .select('*')
    .eq('room_id', roomId)
    .single()

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground flex flex-col relative overflow-hidden">
       {/* Background Blobs */}
       <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse" />
       <div className="absolute bottom-40 -right-20 w-[500px] h-[500px] bg-secondary/10 blur-[150px] rounded-full -z-10" />
       
       {/* Grid Pattern */}
       <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
       
       <Navbar />
       <main className="flex-1 w-full mx-auto p-2 sm:p-4 relative z-10">
          <GameClient 
            room={room} 
            initialGameState={gameState!} 
            currentUser={user.id} 
          />
       </main>
    </div>
  )
}
