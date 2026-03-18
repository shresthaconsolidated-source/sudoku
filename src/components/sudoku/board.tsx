'use client'

import React, { useState, useEffect } from 'react'

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
  onCellUpdate: (row: number, col: number, newData: CellContent, newState: BoardState) => void
}

export default function SudokuBoard({ initialGrid, solutionGrid, currentGrid, onCellUpdate }: SudokuBoardProps) {
  // Initialize board state if not provided (e.g., from DB)
  const [board, setBoard] = useState<BoardState>(() => {
    if (currentGrid) return currentGrid
    
    return initialGrid.map(row => 
      row.map(val => ({
        value: val,
        notes: [],
        isGiven: val !== null,
        isError: false
      }))
    )
  })

  // Keep local board in sync with remote if it changes
  useEffect(() => {
    if (currentGrid) {
      setBoard(currentGrid)
    }
  }, [currentGrid])

  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null)
  const [isNotesMode, setIsNotesMode] = useState(false)

  // Handlers
  const handleCellClick = (r: number, c: number) => {
    setSelectedCell({ r, c })
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!selectedCell) return

    const { r, c } = selectedCell
    const cell = board[r][c]

    if (e.key >= '1' && e.key <= '9') {
      const num = parseInt(e.key)
      if (cell.isGiven) return

      const newBoard = [...board.map(row => [...row])]
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
        // Auto-clear notes from this cell when a number is placed
        newCell.notes = []
      }

      newBoard[r][c] = newCell
      setBoard(newBoard)
      onCellUpdate(r, c, newCell, newBoard)
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      if (cell.isGiven) return
      const newBoard = [...board.map(row => [...row])]
      const newCell = { ...newBoard[r][c], value: null, isError: false }
      newBoard[r][c] = newCell
      setBoard(newBoard)
      onCellUpdate(r, c, newCell, newBoard)
    } else if (e.key.startsWith('Arrow')) {
      e.preventDefault()
      if (e.key === 'ArrowUp' && r > 0) setSelectedCell({ r: r - 1, c })
      if (e.key === 'ArrowDown' && r < 8) setSelectedCell({ r: r + 1, c })
      if (e.key === 'ArrowLeft' && c > 0) setSelectedCell({ r, c: c - 1 })
      if (e.key === 'ArrowRight' && c < 8) setSelectedCell({ r, c: c + 1 })
    }
  }

  // Attach keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  // Helpers for highlighting
  const isSelected = (r: number, c: number) => selectedCell?.r === r && selectedCell?.c === c
  const isPeer = (r: number, c: number) => {
    if (!selectedCell) return false
    if (isSelected(r, c)) return false
    
    // Same row, same col
    if (selectedCell.r === r || selectedCell.c === c) return true
    
    // Same 3x3 block
    const blockR = Math.floor(selectedCell.r / 3) * 3
    const blockC = Math.floor(selectedCell.c / 3) * 3
    return r >= blockR && r < blockR + 3 && c >= blockC && c < blockC + 3
  }
  
  const isSameValueHighlight = (r: number, c: number) => {
    if (!selectedCell) return false
    const selVal = board[selectedCell.r][selectedCell.c].value
    return selVal !== null && selVal === board[r][c].value && !isSelected(r, c)
  }

  return (
    <div className="flex flex-col items-center select-none w-full max-w-lg mx-auto">
      {/* The 9x9 Grid */}
      <div 
        className="grid grid-cols-9 grid-rows-9 gap-0 border-4 border-slate-700/50 bg-slate-900/50 w-full aspect-square touch-manipulation rounded-sm overflow-hidden shadow-2xl shadow-primary/10"
      >
        {board.map((row, r) => 
          row.map((cell, c) => {
            // Determine border styles for 3x3 subgrids
            const isRightBorder = c === 2 || c === 5
            const isBottomBorder = r === 2 || r === 5
            
            // Determine cell background classes
            let bgClass = 'bg-card/40 backdrop-blur-sm'
            if (isSelected(r, c)) bgClass = 'bg-primary/30'
            else if (isSameValueHighlight(r, c)) bgClass = 'bg-primary/50'
            else if (isPeer(r, c)) bgClass = 'bg-white/5'

            // Determine text color
            let textClass = 'text-slate-300'
            if (cell && cell.isGiven) textClass = 'text-white font-medium'
            else if (cell && cell.isError) textClass = 'text-destructive font-bold drop-shadow-[0_0_8px_rgba(255,51,51,0.8)]'
            else textClass = 'text-primary font-bold drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]' // User entered correct

            return (
              <div 
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`
                  relative flex items-center justify-center text-xl sm:text-2xl md:text-3xl lg:text-4xl 
                  transition-colors duration-200 cursor-pointer border border-white/10
                  ${bgClass} ${textClass}
                  ${isRightBorder ? 'border-r-slate-500/50 border-r-[3px]' : ''}
                  ${isBottomBorder ? 'border-b-slate-500/50 border-b-[3px]' : ''}
                `}
              >
                {cell && cell.value ? (
                   cell.value
                ) : (
                  // Render Notes
                  cell && (cell.notes || []).length > 0 && (
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <div key={n} className="flex items-center justify-center text-[8px] sm:text-[10px] md:text-xs text-slate-400 font-medium leading-none">
                          {(cell.notes || []).includes(n) ? n : ''}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between w-full mt-6 px-2">
         <button 
           className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${isNotesMode ? 'bg-primary/20 text-primary border border-primary/50 shadow-primary/20 scale-105' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
           onClick={() => setIsNotesMode(!isNotesMode)}
         >
           ✏️ Notes ({isNotesMode ? 'ON' : 'OFF'})
         </button>

         <button 
           className="px-6 py-3 rounded-xl font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30 transition-all shadow-lg shadow-destructive/10"
           onClick={() => {
             if (selectedCell && !board[selectedCell.r][selectedCell.c].isGiven) {
                const newBoard = [...board.map(r => [...r])]
                const newCell = { ...newBoard[selectedCell.r][selectedCell.c], value: null, isError: false }
                newBoard[selectedCell.r][selectedCell.c] = newCell
                setBoard(newBoard)
                onCellUpdate(selectedCell.r, selectedCell.c, newCell, newBoard)
             }
           }}
         >
           🗑️ Erase
         </button>
      </div>

      {/* Number Pad (for mobile / mouse users) */}
      <div className="grid grid-cols-9 gap-1 sm:gap-2 w-full mt-6 px-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            className="aspect-square bg-slate-800/80 backdrop-blur hover:bg-primary/20 hover:text-primary rounded-xl text-lg sm:text-2xl font-bold text-slate-200 transition-all border border-slate-700/50 shadow-lg"
            onClick={() => {
              if (selectedCell && !board[selectedCell.r][selectedCell.c].isGiven) {
                // Manually trigger the keyboard logic payload
                handleKeyDown(new KeyboardEvent('keydown', { key: num.toString() }))
              }
            }}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  )
}
