'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type CellContent = {
  value: number | null
  notes: number[]
  isGiven: boolean
  isError: boolean
}

type BoardState = CellContent[][]

interface SudokuBoardProps {
  initialGrid: (number | null)[][]
  solutionGrid: number[][]
  currentGrid: BoardState | null
  opponentCursor?: { r: number, c: number, name?: string } | null
  onCellUpdate: (row: number, col: number, newData: CellContent, newState: BoardState) => void
  onCursorMove?: (r: number, c: number) => void
}

const SudokuCell = React.memo(({ 
  r, c, cell, isSelected, isOpponent, isPeer, isSameValue, isRightBorder, isBottomBorder, onClick 
}: { 
  r: number, c: number, cell: CellContent, isSelected: boolean, isOpponent: boolean, isPeer: boolean, isSameValue: boolean, isRightBorder: boolean, isBottomBorder: boolean, onClick: () => void 
}) => {
  let bgClass = 'bg-card/40 backdrop-blur-md'
  if (isSelected) bgClass = 'bg-primary/20 ring-inset ring-2 ring-primary/50'
  else if (isOpponent) bgClass = 'bg-secondary/20 ring-inset ring-2 ring-secondary/50'
  else if (isSameValue) bgClass = 'bg-white/10'
  else if (isPeer) bgClass = 'bg-white/[0.02]'

  let textClass = 'text-slate-400'
  if (cell.isGiven) textClass = 'text-white font-black'
  else if (cell.isError) textClass = 'text-destructive font-black drop-shadow-[0_0_12px_rgba(255,51,51,0.6)]'
  else if (cell.value) textClass = 'text-primary font-black drop-shadow-[0_0_12px_rgba(0,229,255,0.6)]'

  return (
    <motion.div
      onClick={onClick}
      animate={cell.isError ? { x: [0, -2, 2, -2, 2, 0] } : {}}
      className={`
        relative flex items-center justify-center text-xl sm:text-2xl md:text-3xl lg:text-4xl
        cursor-pointer border-[0.5px] border-white/5
        ${bgClass} ${textClass}
        ${isRightBorder ? 'border-r-slate-700/80 border-r-[4px]' : ''}
        ${isBottomBorder ? 'border-b-slate-700/80 border-b-[4px]' : ''}
      `}
    >
      {cell.value ? (
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
              {cell.notes.includes(n) ? n : ''}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isOpponent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-secondary rounded-full shadow-[0_0_10px_#FF0055]"
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
})

SudokuCell.displayName = 'SudokuCell'

export default function SudokuBoard({ initialGrid, solutionGrid, currentGrid, opponentCursor, onCellUpdate, onCursorMove }: SudokuBoardProps) {
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

  const handleCellClick = useCallback((r: number, c: number) => {
    setSelectedCell({ r, c })
    onCursorMove?.(r, c)
  }, [onCursorMove])

  const handleKeyDown = useCallback((e: KeyboardEvent | { key: string }) => {
    if (!selectedCell) return
    const { r, c } = selectedCell
    const cell = board[r][c]

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
      setSelectedCell({ r: nr, c: nc })
      onCursorMove?.(nr, nc)
    }
  }, [selectedCell, board, isNotesMode, solutionGrid, onCellUpdate, onCursorMove])

  useEffect(() => {
    const listener = (e: KeyboardEvent) => handleKeyDown(e)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [handleKeyDown])

  return (
    <div className="flex flex-col items-center select-none w-full max-w-lg mx-auto px-4">
      <div className="grid grid-cols-9 grid-rows-9 gap-0 border-[6px] border-slate-800/80 bg-slate-900/50 w-full aspect-square touch-manipulation rounded-xl overflow-hidden shadow-2xl shadow-primary/5 transition-transform duration-500">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isSelected = selectedCell?.r === r && selectedCell?.c === c
            const isOpponent = opponentCursor?.r === r && opponentCursor?.c === c
            const isSameValue = selectedCell && board[selectedCell.r][selectedCell.c].value !== null && board[selectedCell.r][selectedCell.c].value === cell.value && !isSelected
            
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
                isOpponent={isOpponent}
                isPeer={isPeer}
                isSameValue={!!isSameValue}
                isRightBorder={c === 2 || c === 5}
                isBottomBorder={r === 2 || r === 5}
                onClick={() => handleCellClick(r, c)}
              />
            )
          })
        )}
      </div>

      <div className="flex items-center justify-between w-full mt-10 gap-4">
         <button
           className={`flex-1 h-14 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 ${isNotesMode ? 'bg-primary text-black shadow-primary/20 scale-105' : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'}`}
           onClick={() => setIsNotesMode(!isNotesMode)}
         >
           {isNotesMode ? '✍️ Notes: ON' : '✏️ Notes'}
         </button>

         <button
           className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest bg-white/5 text-destructive hover:bg-destructive/10 border border-destructive/10 transition-all shadow-xl"
           onClick={() => {
             if (selectedCell && !board[selectedCell.r][selectedCell.c].isGiven) {
                handleKeyDown({ key: 'Backspace' })
             }
           }}
         >
           🗑️ Clear
         </button>
      </div>

      <div className="grid grid-cols-9 gap-2 w-full mt-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            className="aspect-square bg-white/5 hover:bg-primary/20 hover:text-primary rounded-xl text-xl sm:text-2xl font-black text-slate-300 transition-all border border-white/10 shadow-xl group overflow-hidden relative"
            onClick={() => {
              if (selectedCell) handleKeyDown({ key: num.toString() })
            }}
          >
            <span className="relative z-10">{num}</span>
            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  )
}
