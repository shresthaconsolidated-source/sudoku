'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'

export default function LogoutButton() {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    // Immediate feedback
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleLogout}
      className="rounded-xl border-white/10 bg-white/5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all font-bold"
    >
      Sign out
    </Button>
  )
}
