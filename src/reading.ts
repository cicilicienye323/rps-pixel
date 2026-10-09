import type { Hand } from './game'

// One GestureRecognizer frame: top category and its score, or null when no hand was found.
export type Frame = { category: string; score: number } | null

export type Reading =
  | { kind: 'locked' | 'ask'; hand: Hand; score: number }
  | { kind: 'again' }
  | { kind: 'nohand' }

const HAND: Record<string, Hand> = { Closed_Fist: 'rock', Open_Palm: 'paper', Victory: 'scissors' }

// The most frequent category wins, ties go to the higher average score.
// Its average score decides: 0.80 and up locks, 0.50 and up asks, below that reads again.
export function readFrames(frames: Frame[]): Reading {
  const groups = new Map<string, number[]>()
  for (const f of frames) {
    const key = f ? f.category : ''
    groups.set(key, [...(groups.get(key) ?? []), f ? f.score : 0])
  }
  const avg = (s: number[]) => s.reduce((a, b) => a + b, 0) / s.length
  const [key, scores] = [...groups].sort((a, b) => b[1].length - a[1].length || avg(b[1]) - avg(a[1]))[0]

  if (key === '') return { kind: 'nohand' }
  const hand = HAND[key]
  const score = Math.round(avg(scores) * 100) / 100
  if (!hand || score < 0.5) return { kind: 'again' }
  return { kind: score >= 0.8 ? 'locked' : 'ask', hand, score }
}
