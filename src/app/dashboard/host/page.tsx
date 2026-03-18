import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import HostClient from '@/components/host-client'

export default async function HostPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  return <HostClient />
}
