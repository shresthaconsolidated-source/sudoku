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
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
       {/* Background decorative glow */}
       <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10" />
       <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/5 blur-[120px] rounded-full -z-10" />
       
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
