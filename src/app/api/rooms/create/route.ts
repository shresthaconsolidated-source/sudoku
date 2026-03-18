import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { getSudoku } from 'sudoku-gen'

// Generate a random 6-character alphanumeric string for the room code
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Convert sudoku-gen 81-char string into our 9x9 2D array representation
const parseGrid = (gridStr: string, isSolution: boolean = false) => {
  const grid = []
  for (let i = 0; i < 9; i++) {
    const row = []
    for (let j = 0; j < 9; j++) {
      const char = gridStr[i * 9 + j]
      if (char === '-') {
        row.push(null)
      } else {
        row.push(parseInt(char, 10))
      }
    }
    grid.push(row)
  }
  return grid
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const formData = await request.formData()
  const difficulty = formData.get('difficulty') as string

  if (!difficulty) {
    return NextResponse.redirect(new URL('/dashboard/host', request.url))
  }

  // 1. Generate an infinite random puzzle on-the-fly using sudoku-gen!
  const genDifficulty = difficulty === 'Easy' ? 'easy' :
                        difficulty === 'Medium' ? 'medium' :
                        difficulty === 'Hard' ? 'hard' : 'expert'
                        
  const rawSudoku = getSudoku(genDifficulty as any)
  const initialGrid = parseGrid(rawSudoku.puzzle)
  const solutionGrid = parseGrid(rawSudoku.solution, true)

  // 2. Save this newly minted puzzle permanently to the database so we have a record
  //    for leaderboards and replayability.
  const { data: insertedPuzzle, error: puzzleError } = await supabase
    .from('puzzles')
    .insert({
      difficulty: difficulty,
      initial_grid: initialGrid,
      solution_grid: solutionGrid
    })
    .select('id')
    .single()

  if (puzzleError || !insertedPuzzle) {
    console.error('Error inserting generated puzzle:', puzzleError)
    return NextResponse.redirect(new URL('/dashboard/host?error=puzzle_gen_failed', request.url))
  }

  // 3. Create a new room with the shiny new puzzle ID
  const roomCode = generateRoomCode()
  const { error } = await supabase
    .from('rooms')
    .insert({
      id: roomCode,
      host_id: user.id,
      puzzle_id: insertedPuzzle.id,
      difficulty: difficulty,
      status: 'waiting'
    })

  if (error) {
    console.error('Error creating room:', error)
    return NextResponse.redirect(new URL('/dashboard/host?error=creation_failed', request.url))
  }

  // 4. Redirect host to the lobby
  return NextResponse.redirect(new URL(`/lobby/${roomCode}`, request.url))
}
