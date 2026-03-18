'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock } from 'lucide-react'

type CellContent = {
  value: number | null
  notes: number[]
  isGiven: boolean
  isError: boolean
  filled_by?: string | null
}

type BoardState = CellContent[][]

interface SudokuBoardProps {
  initialGrid: (number | null)[][]
  solutionGrid: number[][]
  currentGrid: any[][]
  opponentCursor?: { r: number, c: number, name?: string } | null
  onCellUpdate: (row: number, col: number, newData: any, newState: any) => void
  onCursorMove?: (r: number, c: number, prevR?: number, prevC?: number) => void
  lockedCells?: Record<string, { userId: string, name: string }>
  currentUser?: string
}

const SudokuCell = React.memo(({ 
  r, c, cell, isSelected, isOpponent, isPeer, isSameValue, isRightBorder, isBottomBorder, onClick, solution, isLocked, lockedBy 
}: { 
  r: number, c: number, cell: CellContent, isSelected: boolean, isOpponent: boolean, isPeer: boolean, isSameValue: boolean, isRightBorder: boolean, isBottomBorder: boolean, onClick: () => void, solution: number, isLocked: boolean, lockedBy?: string
}) => {
  const isCorrect = cell?.value === solution
  
  let bgClass = 'bg-card/40 backdrop-blur-md'
  if (isSelected) bgClass = 'bg-primary/20 ring-inset ring-2 ring-primary/50'
  else if (isOpponent || isLocked) bgClass = 'bg-secondary/10 ring-inset ring-2 ring-secondary/30'
  else if (isSameValue) bgClass = 'bg-white/10'
  else if (isPeer) bgClass = 'bg-white/[0.02]'

  let textClass = 'text-slate-400'
  if (cell?.isGiven) textClass = 'text-white font-black'
  else if (cell?.isError) textClass = 'text-destructive font-black drop-shadow-[0_0_12px_rgba(255,51,51,0.6)]'
  else if (isCorrect) textClass = 'text-primary font-black drop-shadow-[0_0_12px_rgba(0,229,255,0.6)]'

  return (
    <motion.div
      onClick={isLocked || (isCorrect && !isSelected) ? undefined : onClick}
      animate={cell?.isError ? { x: [0, -2, 2, -2, 2, 0] } : {}}
      className={`
        relative flex items-center justify-center text-xl sm:text-2xl md:text-3xl lg:text-4xl
        cursor-pointer border-[0.5px] border-white/5
        ${bgClass} ${textClass}
        ${isRightBorder ? 'border-r-slate-700/80 border-r-[4px]' : ''}
        ${isBottomBorder ? 'border-b-slate-700/80 border-b-[4px]' : ''}
        ${isLocked ? 'cursor-not-allowed' : ''}
        transition-all duration-200
      `}
    >
      {cell?.value ? (
        <motion.span
          key={`${r}-${c}-${cell.value}`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          {cell.value}
        </motion.span>
      ) : (
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-1 opacity-60">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <div key={n} className="flex items-center justify-center text-[8px] sm:text-[10px] md:text-xs text-slate-500 font-bold">
              {cell?.notes?.includes(n) ? n : ''}
            </div>
          ))}
        </div>
      )}

      {/* Lock Indicator */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"
          >
            <Lock className="w-4 h-4 text-secondary drop-shadow-[0_0_8px_#FF0055]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contribution Glow */}
      {isCorrect && !cell.isGiven && cell.filled_by && (
        <div className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${isOpponent ? 'bg-secondary' : 'bg-primary'} shadow-[0_0_8px_currentColor]`} />
      )}
    </motion.div>
  )
})

SudokuCell.displayName = 'SudokuCell'

export default function SudokuBoard({ 
  initialGrid, solutionGrid, currentGrid, opponentCursor, lockedCells = {}, currentUser, onCellUpdate, onCursorMove 
}: SudokuBoardProps) {
  const [board, setBoard] = useState<BoardState>(() => {
    if (currentGrid) return currentGrid
    return initialGrid.map(row =>
      row.map(val => ({ value: val, notes: [], isGiven: val !== null, isError: false }))
    )
  })

  useEffect(() => {
    if (currentGrid) setBoard(currentGrid)
  }, [currentGrid])

  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null)
  const [isNotesMode, setIsNotesMode] = useState(false)
  const prevSelectedCell = useRef<{r: number, c: number} | null>(null)

  const handleCellClick = useCallback((r: number, c: number) => {
    const isLockedByOther = lockedCells[`${r}-${c}`] && lockedCells[`${r}-${c}`].userId !== currentUser
    const isCorrect = board[r][c]?.value === solutionGrid[r][c]
    
    if (isLockedByOther || isCorrect) return

    onCursorMove?.(r, c, prevSelectedCell.current?.r, prevSelectedCell.current?.c)
    prevSelectedCell.current = { r, c }
    setSelectedCell({ r, c })
  }, [onCursorMove, lockedCells, currentUser, board, solutionGrid])

  const handleKeyDown = useCallback((e: KeyboardEvent | { key: string }) => {
    if (!selectedCell) return
    const { r, c } = selectedCell
    const cell = board[r][c]
    
    // Anti-Griefing: Cannot change correct cells
    if (cell.value === solutionGrid[r][c]) return

    if (e.key >= '1' && e.key <= '9') {
      if (cell.isGiven) return
      const num = parseInt(e.key)
      const newBoard = board.map(row => [...row])
      const newCell = { ...newBoard[r][c] }

      if (isNotesMode) {
        if (newCell.notes.includes(num)) {
          newCell.notes = newCell.notes.filter(n => n !== num)
        } else {
          newCell.notes = [...newCell.notes, num].sort()
        }
      } else {
        newCell.value = num
        newCell.isError = num !== solutionGrid[r][c]
        newCell.notes = []
      }

      newBoard[r][c] = newCell
      setBoard(newBoard)
      onCellUpdate(r, c, newCell, newBoard)
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      if (cell.isGiven) return
      const newBoard = board.map(row => [...row])
      const newCell = { ...newBoard[r][c], value: null, isError: false }
      newBoard[r][c] = newCell
      setBoard(newBoard)
      onCellUpdate(r, c, newCell, newBoard)
    } else if ('preventDefault' in e && (e as KeyboardEvent).key?.startsWith('Arrow')) {
      (e as KeyboardEvent).preventDefault()
      let nr = r, nc = c
      if ((e as KeyboardEvent).key === 'ArrowUp' && r > 0) nr--
      if ((e as KeyboardEvent).key === 'ArrowDown' && r < 8) nr++
      if ((e as KeyboardEvent).key === 'ArrowLeft' && c > 0) nc--
      if ((e as KeyboardEvent).key === 'ArrowRight' && c < 8) nc++
      
      // Check if target is locked or correct before moving cursor there
      const isTargetLocked = lockedCells[`${nr}-${nc}`] && lockedCells[`${nr}-${nc}`].userId !== currentUser
      const isTargetCorrect = board[nr][nc]?.value === solutionGrid[nr][nc]
      
      if (!isTargetLocked && !isTargetCorrect) {
        setSelectedCell({ r: nr, c: nc })
        onCursorMove?.(nr, nc, r, c)
        prevSelectedCell.current = { r: nr, c: nc }
      }
    }
  }, [selectedCell, board, isNotesMode, solutionGrid, onCellUpdate, onCursorMove, lockedCells, currentUser])

  useEffect(() => {
    const listener = (e: KeyboardEvent) => handleKeyDown(e)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [handleKeyDown])

  const completedNumbers = useMemo(() => {
    const counts = new Array(10).fill(0)
    board.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell.value !== null && cell.value === solutionGrid[r][c]) {
          counts[cell.value]++
        }
      })
    })
    return counts.map(count => count === 9)
  }, [board, solutionGrid])

  return (
    <div className="flex flex-col items-center select-none w-full max-w-lg mx-auto px-1 sm:px-4">
      <div className="grid grid-cols-9 grid-rows-9 gap-0 border-[4px] sm:border-[6px] border-slate-800/80 bg-slate-900/50 w-full aspect-square touch-manipulation rounded-xl overflow-hidden shadow-2xl shadow-primary/5 transition-transform duration-500">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isSelected = selectedCell?.r === r && selectedCell?.c === c
            const opponent = opponentCursor?.r === r && opponentCursor?.c === c
            const isLocked = !!lockedCells[`${r}-${c}`] && lockedCells[`${r}-${c}`].userId !== currentUser
            
            const selectedVal = selectedCell ? board[selectedCell.r]?.[selectedCell.c]?.value : null
            const isSameValue = selectedCell && selectedVal !== null && selectedVal === cell?.value && !isSelected
            
            let isPeer = false
            if (selectedCell && !isSelected) {
               if (selectedCell.r === r || selectedCell.c === c) isPeer = true
               else {
                 const blockR = Math.floor(selectedCell.r / 3) * 3
                 const blockC = Math.floor(selectedCell.c / 3) * 3
                 if (r >= blockR && r < blockR + 3 && c >= blockC && c < blockC + 3) isPeer = true
               }
            }

            return (
              <SudokuCell 
                key={`${r}-${c}`}
                r={r} c={c}
                cell={cell}
                isSelected={isSelected}
                isOpponent={opponent}
                isLocked={isLocked}
                lockedBy={lockedCells[`${r}-${c}`]?.name}
                isPeer={isPeer}
                isSameValue={!!isSameValue}
                isRightBorder={c === 2 || c === 5}
                isBottomBorder={r === 2 || r === 5}
                onClick={() => handleCellClick(r, c)}
                solution={solutionGrid[r][c]}
              />
            )
          })
        )}
      </div>

      <div className="flex items-center justify-between w-full mt-6 sm:mt-10 gap-2 sm:gap-4">
         <button
           className={`flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 text-xs sm:text-base ${isNotesMode ? 'bg-primary text-black shadow-primary/20 scale-105' : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'}`}
           onClick={() => setIsNotesMode(!isNotesMode)}
         >
           {isNotesMode ? '✍️ Notes: ON' : '✏️ Notes'}
         </button>

         <button
           className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest bg-white/5 text-destructive hover:bg-destructive/10 border border-destructive/10 transition-all shadow-xl text-xs sm:text-base"
           onClick={() => {
             if (selectedCell) {
                handleKeyDown({ key: 'Backspace' })
             }
           }}
         >
           🗑️ Clear
         </button>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 w-full mt-6 sm:mt-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            className={`aspect-square sm:aspect-square bg-white/5 hover:bg-primary/20 hover:text-primary rounded-xl text-xl sm:text-2xl font-black transition-all border border-white/10 shadow-xl group overflow-hidden relative flex flex-col items-center justify-center ${completedNumbers[num] ? 'opacity-40 grayscale pointer-events-none' : 'text-slate-300'}`}
            onClick={() => {
              if (selectedCell) handleKeyDown({ key: num.toString() })
            }}
          >
            <span className="relative z-10">{num}</span>
            {completedNumbers[num] && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                <svg className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(0,229,255,1)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  )
}
