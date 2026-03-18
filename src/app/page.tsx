import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LandingClient from '@/components/landing-client'

export default async function Home() {
  const supabase = await createClient()

  // If user is already logged in, redirect to dashboard
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    redirect('/dashboard')
  }

  return <LandingClient />
}
