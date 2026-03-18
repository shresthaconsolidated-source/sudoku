import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Grid3X3 } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()

  // If user is already logged in, redirect to dashboard
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full -z-10" />
      
      <Card className="w-full max-w-sm bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="flex justify-center mb-6">
            <div className="rounded-2xl bg-primary/10 p-4 border border-primary/20 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
              <Grid3X3 className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-white mb-1">Sudoku Multi</CardTitle>
          <CardDescription className="text-slate-400 font-medium">Experience the definitive battle of wits</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-12">
          <form action="/auth/google" method="post">
             <div className="flex flex-col gap-4">
              <Link href="/auth/google" className="w-full">
                <Button className="w-full h-14 bg-white hover:bg-slate-100 text-black font-bold text-lg rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]" type="button">
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Connect with Google
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
