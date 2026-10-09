export type Hand = 'rock' | 'paper' | 'scissors'
export type Outcome = 'WIN' | 'DRAW' | 'LOSE'

export const HANDS: Hand[] = ['rock', 'paper', 'scissors']
const BEATS: Record<Hand, Hand> = { rock: 'scissors', paper: 'rock', scissors: 'paper' }

export function outcome(you: Hand, cpu: Hand): Outcome {
  if (you === cpu) return 'DRAW'
  return BEATS[you] === cpu ? 'WIN' : 'LOSE'
}

export function score(rounds: { outcome: Outcome }[]): { you: number; cpu: number } {
  return {
    you: rounds.filter(r => r.outcome === 'WIN').length,
    cpu: rounds.filter(r => r.outcome === 'LOSE').length,
  }
}

export function isOver(rounds: { outcome: Outcome }[]): boolean {
  const s = score(rounds)
  return s.you === 3 || s.cpu === 3
}

// One unbiased byte: 255 is redrawn so 0..254 splits evenly into three.
export function cpuHand(): Hand {
  const b = new Uint8Array(1)
  do crypto.getRandomValues(b)
  while (b[0] === 255)
  return HANDS[b[0] % 3]
}

const pad = (n: number) => String(n).padStart(2, '0')

export function trxNumber(at: Date, bytes: Uint8Array): string {
  const hex = [...bytes.slice(0, 2)].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
  return `RPS-${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}-${hex}`
}

export function newTrx(at: Date): string {
  return trxNumber(at, crypto.getRandomValues(new Uint8Array(2)))
}

export function formatTime(at: Date): string {
  return `${pad(at.getDate())}/${pad(at.getMonth() + 1)}/${at.getFullYear()} ${pad(at.getHours())}:${pad(at.getMinutes())}`
}
