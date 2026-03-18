import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import { Brain, Flame, Skull, Zap } from 'lucide-react'

const DIFFICULTIES = [
  { name: 'Easy', icon: Brain, color: 'text-green-500', bg: 'bg-green-50 border-green-200 hover:border-green-400' },
  { name: 'Medium', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200 hover:border-blue-400' },
  { name: 'Hard', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200 hover:border-orange-400' },
  { name: 'Extreme', icon: Skull, color: 'text-red-500', bg: 'bg-red-50 border-red-200 hover:border-red-400' },
]

export default async function HostPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  return (
    <div className="max-w-2xl mx-auto space-y-8 mt-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Host a Game</h1>
        <p className="text-muted-foreground">
          Select a difficulty. We'll find the next sequential puzzle for you and create a room.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DIFFICULTIES.map((diff) => (
          <form 
            key={diff.name} 
            action="/api/rooms/create" 
            method="post"
          >
            <input type="hidden" name="difficulty" value={diff.name} />
            <button type="submit" className="w-full text-left">
              <Card className={`transition-all shadow-sm ${diff.bg}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{diff.name}</CardTitle>
                    <diff.icon className={`h-5 w-5 ${diff.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Select to generate room
                  </CardDescription>
                </CardContent>
              </Card>
            </button>
          </form>
        ))}
      </div>
      
      <div className="text-center pt-8">
         <form action="/dashboard" method="get">
           <Button variant="ghost">Cancel & Go Back</Button>
         </form>
      </div>
    </div>
  )
}
