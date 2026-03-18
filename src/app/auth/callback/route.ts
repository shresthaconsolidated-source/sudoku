import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && authData.user) {
      // Upsert the user into our public.users table on first login
      const { user } = authData
      
      const email = user.email || ''
      const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.first_name || 'Player'
      const avatarUrl = user.user_metadata?.avatar_url || ''

      // Attempt to insert, ignore if already exists (email constraint or id constraint usually, but we use ID)
      await supabase.from('users').upsert({
        id: user.id,
        email: email,
        first_name: firstName,
        avatar_url: avatarUrl
      }, { onConflict: 'id' }).select()

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-error`)
}
