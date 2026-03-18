import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Button } from './ui/button'
import { Grid3X3, User as UserIcon } from 'lucide-react'
import LogoutButton from './logout-button'

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
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-background/60 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95">
          <div className="rounded-xl bg-primary/10 p-2 border border-primary/20 shadow-[0_0_15px_rgba(0,229,255,0.15)]">
            <Grid3X3 className="h-6 w-6 text-primary" />
          </div>
          <span className="text-2xl font-extrabold tracking-tighter text-white">Sudoku Multi</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="gap-2 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="Profile" className="h-7 w-7 rounded-full border border-white/20 shadow-sm" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                </div>
              )}
              <span className="hidden sm:inline-block font-bold tracking-tight">{profile?.first_name || 'Profile'}</span>
            </Button>
          </Link>
          <LogoutButton />
        </div>
      </div>
    </nav>
  )
}
