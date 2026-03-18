'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import SudokuBoard from '@/components/sudoku/board'
import { Card } from '@/components/ui/card'
import { Clock, CheckCircle2 } from 'lucide-react'

// Basic time formatter
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function GameClient({ room, initialGameState, currentUser }: { room: any, initialGameState: any, currentUser: string }) {
  const supabase = createClient()
  const [gameState, setGameState] = useState(initialGameState)
  const [elapsed, setElapsed] = useState(0)
  const [isFinished, setIsFinished] = useState(room.status === 'completed')
  const [mistakes, setMistakes] = useState(0)
  
  // Ref to prevent re-broadcasting ourselves
  const isLocalUpdate = useRef(false)

  // Timer
  useEffect(() => {
    if (isFinished || !gameState.start_time) return
    
    // Start elapsed time based on DB start_time to keep both clients synced
    const start = new Date(gameState.start_time).getTime()
    
    const interval = setInterval(() => {
      const now = new Date().getTime()
      setElapsed(Math.floor((now - start) / 1000))
    }, 1000)
    
    return () => clearInterval(interval)
  }, [gameState.start_time, isFinished])

  // Count mistakes
  useEffect(() => {
    if (!gameState.current_grid) return
    let m = 0
    const solution = room.puzzle.solution_grid
    
    gameState.current_grid.forEach((row: any[], r: number) => {
      row.forEach((cell: any, c: number) => {
        if (cell && !cell.isGiven && cell.value !== null && cell.value !== solution[r][c]) {
          m++
        }
      })
    })
    setMistakes(m)

    // Check Win Condition (no mistakes, all cells filled)
    let isComplete = true
    gameState.current_grid.forEach((row: any[], r: number) => {
      row.forEach((cell: any, c: number) => {
        if (!cell || cell.value !== solution[r][c]) {
          isComplete = false
        }
      })
    })

    if (isComplete && !isFinished) {
      handleWin()
    }
  }, [gameState.current_grid, room.puzzle.solution_grid, isFinished])

  const handleWin = async () => {
    setIsFinished(true)
    
    // 1. Mark room as completed
    await supabase.from('rooms').update({ status: 'completed' }).eq('id', room.id)
    
    // 2. Mark game end time
    await supabase.from('game_state').update({ end_time: new Date().toISOString() }).eq('room_id', room.id)

    // Only host does the DB writes to avoid duplicates
    if (currentUser === room.host_id) {
       // 3. Insert Leaderboard Entry
       const playerNames = [room.host.first_name]
       if (room.joiner) playerNames.push(room.joiner.first_name)
       
       await supabase.from('leaderboard').insert({
         puzzle_id: room.puzzle_id,
         player_names: playerNames,
         time_taken_seconds: elapsed
       })

       // 4. Update user_progress for both
       const updates = [
         supabase.from('user_progress').upsert({ user_id: room.host_id, difficulty: room.difficulty, last_completed_puzzle_id: room.puzzle_id }),
         // @ts-ignore
         supabase.rpc('increment_completed', { user_id: room.host_id }) // Assume we'd make this RPC or handle it via a webhook
       ]

       if (room.joiner_id) {
         updates.push(supabase.from('user_progress').upsert({ user_id: room.joiner_id, difficulty: room.difficulty, last_completed_puzzle_id: room.puzzle_id }))
         // @ts-ignore
         updates.push(supabase.rpc('increment_completed', { user_id: room.joiner_id }))
       }
       
       await Promise.allSettled(updates)
    }
  }

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`game_${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_state',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          // Ignore if we caused this update
          if (isLocalUpdate.current) {
            isLocalUpdate.current = false
            return
          }
          setGameState(payload.new)
        }
      )
      .on( // also listen to room changes for game end
         'postgres_changes',
         { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
         (payload) => {
            if (payload.new.status === 'completed') {
               setIsFinished(true)
            }
         }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room.id, supabase])

  const handleCellUpdate = async (r: number, c: number, newCellData: any, newBoard: any) => {
    // Optimistic UI updates are handled internally by board component
    isLocalUpdate.current = true
    
    setGameState((prev: any) => ({
      ...prev,
      current_grid: newBoard
    }))

    // Debounce/Throttle? For this tiny JSON it's fast enough to send directly
    await supabase
      .from('game_state')
      .update({ current_grid: newBoard })
      .eq('room_id', room.id)
  }

  // Fallback initial grid to properly format missing data
  const boardData = gameState.current_grid?.length > 0 && gameState.current_grid[0][0] !== null
    ? gameState.current_grid 
    : room.puzzle.initial_grid.map((row: (number | null)[]) => 
        row.map(val => ({ value: val, notes: [], isGiven: val !== null, isError: false }))
      )

  return (
    <div className="flex flex-col items-center w-full animate-in fade-in duration-500 pb-20">
      
      {/* Top Info Bar */}
      <div className="w-full max-w-lg mb-6 flex justify-between items-center text-slate-700 font-medium px-2">
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight">{room.difficulty}</span>
          <span className="text-sm text-red-500 font-bold tracking-wide">
            Mistakes: {mistakes}/3
          </span>
        </div>
        
        <div className="flex items-center space-x-2 text-2xl font-mono tracking-tighter tabular-nums bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          <Clock className="w-5 h-5 text-blue-500" />
          <span>{formatTime(elapsed)}</span>
        </div>
        
        <div className="flex items-center -space-x-3">
           {room.host.avatar_url ? (
             // eslint-disable-next-line @next/next/no-img-element
             <img src={room.host.avatar_url} alt="H" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
           ) : (
             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 border-2 border-white shadow-sm z-10">{room.host.first_name?.[0]}</div>
           )}
           
           {room.joiner ? (
              room.joiner.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={room.joiner.avatar_url} alt="J" className="w-10 h-10 rounded-full border-2 border-white shadow-sm z-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 border-2 border-white shadow-sm z-0">{room.joiner.first_name?.[0]}</div>
              )
           ) : null}
        </div>
      </div>

      <SudokuBoard 
        initialGrid={room.puzzle.initial_grid}
        solutionGrid={room.puzzle.solution_grid}
        currentGrid={boardData}
        onCellUpdate={handleCellUpdate}
      />

      {/* Victory Overlay Modal */}
      {isFinished && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white animate-in zoom-in-95 duration-300">
             <div className="h-32 bg-gradient-to-br from-green-400 to-emerald-600 rounded-t-xl flex flex-col items-center justify-center text-white relative overflow-hidden">
               <CheckCircle2 className="w-16 h-16 mb-2" />
               <h2 className="text-3xl font-extrabold tracking-tight">Excellent!</h2>
             </div>
             <div className="p-8 text-center space-y-6">
                <div>
                  <p className="text-slate-500 font-medium mb-1">Time taken</p>
                  <p className="text-4xl font-mono tabular-nums font-bold text-slate-800">{formatTime(elapsed)}</p>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4 text-left border border-slate-100">
                  <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Top Times</p>
                  {/* Realtime would fetch this, but for UX simplicity we'll show a placeholder here until Profile page is done */}
                  <div className="flex justify-between items-center py-1">
                    <span className="font-medium text-slate-700">1. {room.host.first_name}{room.joiner ? ` & ${room.joiner.first_name}` : ''}</span>
                    <span className="font-mono text-sm font-bold text-slate-600">{formatTime(elapsed)}</span>
                  </div>
                </div>

                <a href="/dashboard" className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
                  Return to Dashboard
                </a>
             </div>
          </Card>
        </div>
      )}

    </div>
  )
}
