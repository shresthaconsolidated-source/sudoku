import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 animate-in fade-in duration-700">
        <div className="p-4 rounded-3xl bg-destructive/10 border border-destructive/20 shadow-[0_0_30px_rgba(255,51,51,0.1)]">
          <h1 className="text-3xl font-black text-white">Room Not Found</h1>
        </div>
        <p className="text-slate-400 font-medium text-lg text-center max-w-md">
          The code <span className="text-white font-mono">{roomCode}</span> is invalid or has expired.
        </p>
        <Link href="/dashboard" className="text-primary hover:text-primary/80 font-bold text-lg transition-colors underline decoration-primary/30 underline-offset-4">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  if (room.status === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 animate-in fade-in duration-700">
        <div className="p-4 rounded-3xl bg-primary/10 border border-primary/20 shadow-[0_0_30px_rgba(0,229,255,0.1)]">
          <h1 className="text-3xl font-black text-white">Arena Cleared</h1>
        </div>
        <p className="text-slate-400 font-medium text-lg">This game has already finished.</p>
        <Link href="/dashboard" className="text-primary hover:text-primary/80 font-bold text-lg transition-colors underline decoration-primary/30 underline-offset-4">
          Return to Dashboard
        </Link>
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
        <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 animate-in fade-in duration-700">
          <div className="p-4 rounded-3xl bg-secondary/10 border border-secondary/20 shadow-[0_0_30px_rgba(255,0,85,0.1)]">
            <h1 className="text-3xl font-black text-white">Arena Full</h1>
          </div>
          <p className="text-slate-400 font-medium text-lg">There are already 2 players in this room.</p>
          <Link href="/dashboard" className="text-primary hover:text-primary/80 font-bold text-lg transition-colors underline decoration-primary/30 underline-offset-4">
            Return to Dashboard
          </Link>
        </div>
      )
    } 
else {
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
