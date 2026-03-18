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
    <form onSubmit={handleJoin} className="flex space-x-2">
      <Input
        type="text"
        placeholder="6-Digit Code"
        className="h-12 uppercase"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        maxLength={6}
      />
      <Button 
        type="submit" 
        className="h-12 px-8" 
        variant="secondary"
        disabled={code.trim().length !== 6}
      >
        Join
      </Button>
    </form>
  )
}
