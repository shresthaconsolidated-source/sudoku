import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Swords, Zap, Users } from 'lucide-react'
import Link from 'next/link'
import JoinRoomForm from './join-room-form'

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back, {profile?.first_name || 'Player'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Ready for another mental workout?
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.total_completed || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.win_rate || '0'}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:border-blue-500 transition-colors shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-blue-500" />
              Host a Game
            </CardTitle>
            <CardDescription>
              Create a new room, invite a friend, and race to finish the puzzle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/host" className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-md">
                Create Room
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-indigo-500 transition-colors shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              Join a Game
            </CardTitle>
            <CardDescription>
              Have an invite code? Enter it below to join your friend's lobby.
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
