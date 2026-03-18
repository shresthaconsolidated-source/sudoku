'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

export default function JoinRoomForm() {
  const [code, setCode] = useState('')
  const router = useRouter()

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim().length === 6) {
      router.push(`/lobby/${code.trim().toUpperCase()}`)
    }
  }

  return (
    <form onSubmit={handleJoin} className="flex gap-3">
      <Input
        type="text"
        placeholder="ENTER CODE"
        className="h-14 uppercase bg-white/5 border-white/10 rounded-2xl text-lg font-bold tracking-widest placeholder:text-slate-600 focus:border-secondary/50 focus:ring-secondary/20 transition-all px-6"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        maxLength={6}
      />
      <Button 
        type="submit" 
        className={`h-14 px-10 rounded-2xl font-black text-lg shadow-lg transition-all ${code.trim().length === 6 ? 'bg-secondary hover:bg-secondary/90 text-white shadow-secondary/20 active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`} 
        disabled={code.trim().length !== 6}
      >
        JOIN
      </Button>
    </form>
  )
}
