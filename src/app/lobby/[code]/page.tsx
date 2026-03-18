import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LobbyClient from './lobby-client'

export default async function LobbyPage(props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const roomCode = params.code.toUpperCase()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // Force login but redirect back to this room
    redirect(`/?next=/lobby/${roomCode}`)
  }

  // Fetch room details
  const { data: room, error } = await supabase
    .from('rooms')
    .select(`
      *,
      host:users!rooms_host_id_fkey(id, first_name, avatar_url),
      joiner:users!rooms_joiner_id_fkey(id, first_name, avatar_url)
    `)
    .eq('id', roomCode)
    .single()

  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">Room not found</h1>
        <p className="text-muted-foreground">The room code {roomCode} is invalid or has expired.</p>
        <a href="/dashboard" className="text-blue-500 hover:underline">Go back to Dashboard</a>
      </div>
    )
  }

  if (room.status === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">Game Completed</h1>
        <p className="text-muted-foreground">This game has already finished.</p>
        <a href="/dashboard" className="text-blue-500 hover:underline">Go back to Dashboard</a>
      </div>
    )
  }

  const isHost = user.id === room.host_id
  const isJoiner = user.id === room.joiner_id

  // If user is not host and not joiner...
  if (!isHost && !isJoiner) {
    if (room.joiner_id) {
       // Room is full
       return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <h1 className="text-2xl font-bold">Room Full</h1>
          <p className="text-muted-foreground">There are already 2 players in this room.</p>
          <a href="/dashboard" className="text-blue-500 hover:underline">Go back to Dashboard</a>
        </div>
      )
    } else {
      // User is the joiner! Join the room.
      await supabase
        .from('rooms')
        .update({ joiner_id: user.id })
        .eq('id', roomCode)
      
      // refresh data for client
      room.joiner_id = user.id
      const { data: me } = await supabase.from('users').select('id, first_name, avatar_url').eq('id', user.id).single()
      room.joiner = me
    }
  }

  // Render client component for realtime syncing and UI
  return <LobbyClient initialRoom={room} currentUser={user.id} />
}
