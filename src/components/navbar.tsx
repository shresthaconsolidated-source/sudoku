import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Button } from './ui/button'
import { Grid3X3, User as UserIcon } from 'lucide-react'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // fetch user info from db for avatar
  const { data: profile } = await supabase
    .from('users')
    .select('first_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-500 p-1.5">
            <Grid3X3 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Sudoku Multi</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="gap-2">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="Profile" className="h-6 w-6 rounded-full" />
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
              <span className="hidden sm:inline-block font-medium">{profile?.first_name || 'Profile'}</span>
            </Button>
          </Link>
          <form action="/auth/logout" method="post">
            <Button variant="outline" size="sm">Sign out</Button>
          </form>
        </div>
      </div>
    </nav>
  )
}
