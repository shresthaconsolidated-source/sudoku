import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  // use the URL constructor to build the callback URL
  const { origin } = new URL(request.url)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (data.url) {
    redirect(data.url) // use the redirect API for your server framework
  }

  if (error) {
     redirect('/?message=Could not authenticate user')
  }
}
