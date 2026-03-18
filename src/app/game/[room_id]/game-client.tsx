'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import SudokuBoard from '@/components/sudoku/board'
import { Card } from '@/components/ui/card'
import { Clock, CheckCircle2, Trophy, Zap, Swords, Users, Copy, Play, Check, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// Basic time formatter
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// Synthesized Sound Effects
const playPopSound = () => {
  if (typeof window === 'undefined') return
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(440, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1)
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.1)
}

const playMistakeSound = () => {
  if (typeof window === 'undefined') return
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(220, ctx.currentTime)
  osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.2)
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.2)
}

import confetti from 'canvas-confetti'

export default function GameClient({ room, initialGameState, currentUser }: { room: any, initialGameState: any, currentUser: string }) {
  const supabase = createClient()
  const [gameState, setGameState] = useState(initialGameState)
  const [elapsed, setElapsed] = useState(0)
  const [isFinished, setIsFinished] = useState(room.status === 'completed')
  const [mistakes, setMistakes] = useState(initialGameState?.mistakes_count || 0)
  const [opponentCursor, setOpponentCursor] = useState<{r: number, c: number, name?: string} | null>(null)
  const [lockedCells, setLockedCells] = useState<Record<string, { userId: string, name: string }>>({})
  const isLocalUpdate = useRef(false)
  const channelRef = useRef<any>(null)

  const isHost = currentUser === room.host_id
  const myName = isHost ? room.host.first_name : room.joiner?.first_name || 'Player'

  // Timer logic
  useEffect(() => {
    if (isFinished || !gameState.start_time) return
    const start = new Date(gameState.start_time).getTime()
    const interval = setInterval(() => {
      const now = new Date().getTime()
      setElapsed(Math.floor((now - start) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [gameState.start_time, isFinished])

  // Win logic (Mistakes are now synced from DB)
  useEffect(() => {
    if (!gameState?.current_grid) return
    
    // Update local mistakes from DB state
    if (gameState.mistakes_count !== undefined) {
      if (gameState.mistakes_count > mistakes) playMistakeSound()
      setMistakes(gameState.mistakes_count)
    }

    const solution = room.puzzle.solution_grid
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
  }, [gameState.current_grid, gameState.mistakes_count, room.puzzle.solution_grid, isFinished])

  const handleWin = async () => {
    if (isFinished) return
    setIsFinished(true)
    
    // Celebration!
    const duration = 5 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
    }, 250)
    
    const updates: any[] = [
      supabase.from('rooms').update({ status: 'completed' }).eq('id', room.id),
      supabase.from('game_state').update({ end_time: new Date().toISOString() }).eq('room_id', room.id)
    ]

    // Self-service stats update: each player updates their own stats
    updates.push(supabase.from('user_progress').upsert({ user_id: currentUser, difficulty: room.difficulty, last_completed_puzzle_id: room.puzzle_id }))
    updates.push(supabase.rpc('increment_completed', { target_user_id: currentUser }))
    updates.push(supabase.rpc('increment_mmr', { target_user_id: currentUser, amount: 25 }))

    // Leaderboard insertion (only the host handles the global record)
    if (currentUser === room.host_id) {
       const playerNames = [room.host.first_name]
       if (room.joiner) playerNames.push(room.joiner.first_name)
       updates.push(supabase.from('leaderboard').insert({
         puzzle_id: room.puzzle_id,
         player_names: playerNames,
         time_taken_seconds: elapsed
       }))
    }
    
    await Promise.allSettled(updates)
  }

  // Calculate individual contributions
  const getContribution = () => {
    if (!gameState?.current_grid) return { host: 0, joiner: 0, total: 0 }
    let hostFilled = 0
    let joinerFilled = 0
    let totalCorrect = 0
    const solution = room.puzzle.solution_grid
    
    gameState.current_grid.forEach((row: any[], r: number) => {
      row.forEach((cell: any, c: number) => {
        if (cell?.value === solution[r][c]) {
          totalCorrect++
          if (!cell.isGiven) {
            if (cell.filled_by === room.host_id) hostFilled++
            if (cell.filled_by === room.joiner_id) joinerFilled++
          }
        }
      })
    })

    const totalEmpty = 81 - gameState.current_grid.flat().filter((c: any) => c.isGiven).length
    return {
      host: room.host_id ? Math.floor((hostFilled / totalEmpty) * 100) : 0,
      joiner: room.joiner_id ? Math.floor((joinerFilled / totalEmpty) * 100) : 0,
      total: Math.floor((totalCorrect / 81) * 100)
    }
  }
  const contribution = getContribution()

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`game_${room.id}`, { config: { broadcast: { ack: false } } })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_state', filter: `room_id=eq.${room.id}` }, (payload: any) => {
        if (isLocalUpdate.current) { isLocalUpdate.current = false; return; }
        setGameState(payload.new)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload: any) => {
        if (payload.new.status === 'completed') setIsFinished(true)
      })
      .on('broadcast', { event: 'cursor-pos' }, (payload) => {
         if (payload.payload.userId !== currentUser) {
           setOpponentCursor(payload.payload)
           // Automatically lock the cell for the opponent
           setLockedCells(prev => ({
             ...prev,
             [`${payload.payload.r}-${payload.payload.c}`]: { userId: payload.payload.userId, name: payload.payload.name }
           }))
         }
      })
      .on('broadcast', { event: 'cell-unlock' }, (payload) => {
         setLockedCells(prev => {
           const next = { ...prev }
           delete next[`${payload.payload.r}-${payload.payload.c}`]
           return next
         })
      })
      .subscribe()
      
    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [room.id, supabase, currentUser])

  const handleCellUpdate = async (r: number, c: number, newCellData: any, newBoard: any) => {
    const isCorrect = newCellData.value === room.puzzle.solution_grid[r][c]
    const wasMistake = newCellData.value !== null && !isCorrect
    
    // If it's correct, mark who did it
    if (isCorrect) {
      newBoard[r][c].filled_by = currentUser
    }

    playPopSound()
    if (wasMistake) playMistakeSound()

    isLocalUpdate.current = true
    setGameState((prev: any) => ({ 
      ...prev, 
      current_grid: newBoard,
      mistakes_count: wasMistake ? (prev.mistakes_count || 0) + 1 : prev.mistakes_count
    }))

    const updates: any = { current_grid: newBoard }
    if (wasMistake) {
      updates.mistakes_count = (gameState.mistakes_count || 0) + 1
    }

    await supabase.from('game_state').update(updates).eq('room_id', room.id)
  }

  const handleCursorMove = (r: number, c: number, prevR?: number, prevC?: number) => {
     if (channelRef.current) {
       // Unlock previous cell if any
       if (prevR !== undefined && prevC !== undefined) {
         channelRef.current.send({
           type: 'broadcast',
           event: 'cell-unlock',
           payload: { r: prevR, c: prevC, userId: currentUser }
         })
       }
       
       // Lock new cell
       channelRef.current.send({
         type: 'broadcast',
         event: 'cursor-pos',
         payload: { r, c, name: myName, userId: currentUser }
       }).catch(() => {})
     }
  }

  const boardData = (gameState?.current_grid?.length > 0 && typeof gameState.current_grid[0][0] === 'object' && gameState.current_grid[0][0] !== null)
    ? gameState.current_grid 
    : room.puzzle.initial_grid.map((row: (number | null)[]) => 
        row.map((val: number | null) => ({ value: val, notes: [], isGiven: val !== null, isError: false }))
      )

  return (
    <div className="flex flex-col items-center w-full animate-in fade-in duration-1000 pb-20 mt-4">
      
      {/* Top Info Bar */}
      <div className="w-full max-w-lg mb-8 flex justify-between items-center px-2">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col">
          <span className="text-2xl font-black tracking-tighter text-white">{room.difficulty.toUpperCase()}</span>
          <span className={`text-xs font-black tracking-widest uppercase transition-colors px-2 py-0.5 rounded-full inline-block w-fit ${mistakes > 0 ? 'bg-destructive/20 text-destructive border border-destructive/30' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
            Mistakes: {mistakes}/3
          </span>
        </motion.div>
        
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center space-x-3 text-3xl font-black tracking-tighter tabular-nums bg-card/40 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-2xl">
          <Clock className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
          <span className="text-white">{formatTime(elapsed)}</span>
        </motion.div>
        
        <div className="flex items-center -space-x-4">
           {[room.host, room.joiner].filter(Boolean).map((player, idx) => (
             <motion.div 
               key={player.id}
               initial={{ scale: 0, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ delay: 0.1 * idx }}
               className="relative"
               title={player.first_name}
             >
               {player.avatar_url ? (
                 <img src={player.avatar_url} alt={player.first_name} className={`w-12 h-12 rounded-full border-2 ${idx === 0 ? 'border-primary' : 'border-secondary'} shadow-lg`} />
               ) : (
                 <div className={`w-12 h-12 rounded-full ${idx === 0 ? 'bg-primary/20 text-primary border-primary/40' : 'bg-secondary/20 text-secondary border-secondary/40'} border-2 flex items-center justify-center font-black shadow-lg`}>
                   {player.first_name?.[0]}
                 </div>
               )}
             </motion.div>
           ))}
        </div>
      </div>

      {/* Dual Progress Bar */}
      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        className="w-full max-w-lg px-2 mb-6"
      >
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#00E5FF]">
             {room.host.first_name}: {contribution.host}%
          </span>
          {room.joiner && (
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF0055]">
               {room.joiner.first_name}: {contribution.joiner}%
            </span>
          )}
        </div>
        <div className="h-2.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5 flex">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${contribution.host}%` }}
            className="h-full bg-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)]"
          />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${contribution.joiner}%` }}
            className="h-full bg-[#FF0055] shadow-[0_0_15px_rgba(255,0,85,0.4)]"
          />
        </div>
        <div className="mt-2 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Completion: {contribution.total}%</span>
        </div>
      </motion.div>

      <SudokuBoard 
        initialGrid={room.puzzle.initial_grid}
        solutionGrid={room.puzzle.solution_grid}
        currentGrid={boardData}
        onCellUpdate={handleCellUpdate}
        onCursorMove={handleCursorMove}
        opponentCursor={opponentCursor}
        lockedCells={lockedCells}
        currentUser={currentUser}
      />

      {/* Victory Overlay */}
      <AnimatePresence>
        {isFinished && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.9, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="w-full max-w-md bg-card/80 border border-white/10 rounded-[2.5rem] shadow-2xl shadow-primary/20 overflow-hidden"
            >
               <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex flex-col items-center justify-center text-white relative overflow-hidden border-b border-white/10">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent animate-pulse" />
                 <CheckCircle2 className="w-24 h-24 mb-4 text-primary drop-shadow-[0_0_15px_rgba(0,229,255,0.8)]" />
                 <h2 className="text-4xl font-black tracking-tighter uppercase italic">VICTORY</h2>
               </div>
               <div className="p-10 text-center space-y-8">
                  <div className="space-y-1">
                    <p className="text-slate-500 font-black tracking-widest text-xs uppercase">FINISH TIME</p>
                    <p className="text-6xl font-black tracking-tighter text-white tabular-nums drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{formatTime(elapsed)}</p>
                  </div>
                                    <div className="bg-white/5 rounded-3xl p-6 text-left border border-white/10 shadow-inner">
                     <p className="text-[10px] font-black text-slate-500 mb-4 uppercase tracking-[0.2em]">Match Analytics</p>
                     <div className="space-y-3">
                       <div className="flex justify-between items-center bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                         <span className="font-bold text-white text-xs uppercase">🏆 {room.host.first_name}</span>
                         <span className="font-black text-primary text-xs">{contribution.host}% Contribution</span>
                       </div>
                       {room.joiner && (
                         <div className="flex justify-between items-center bg-secondary/10 border border-secondary/20 rounded-xl px-4 py-3">
                           <span className="font-bold text-white text-xs uppercase">⚔️ {room.joiner.first_name}</span>
                           <span className="font-black text-secondary text-xs">{contribution.joiner}% Contribution</span>
                         </div>
                       )}
                       <div className="flex justify-between items-center bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                         <span className="font-bold text-white text-xs uppercase">⚠️ Total Mistakes</span>
                         <span className="font-black text-red-500 text-xs">{mistakes} Points</span>
                       </div>
                     </div>
                   </div>

                  <Link href="/dashboard" className="block w-full py-5 bg-white hover:bg-slate-100 text-black font-black rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-95 text-lg uppercase tracking-tight">
                    Return to Hub
                  </Link>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
