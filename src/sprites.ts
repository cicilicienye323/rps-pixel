// Pixel sprites and 5 x 7 pixel text, rendered as inline SVG.
// Grids come from the approved mockups (02-DESAIN).
import type { Hand } from './game'

const PAL: Record<string, string> = {"k": "#0d0b1a", "w": "#fff8f0", "g": "#b8b0c8", "r": "#e43b44", "b": "#3b7dd8", "y": "#ffd23f", "G": "#63c74d"}

const ART: Record<Hand, string[]> = {
  "rock": [
    "................",
    "................",
    "....kkkkkkkk....",
    "...kwwkwwkwwkk..",
    "...kwwkwwkwwkwk.",
    "..kkwwkwwkwwkwk.",
    ".kwkwwkwwkwwkwk.",
    ".kwwkkkkkkkkkwk.",
    ".kwwwwwwwwwwwgk.",
    ".kwwwwwwwwwwwgk.",
    "..kwwwwwwwwwggk.",
    "...kwwwwwwwggk..",
    "....kggggggggk..",
    "....krrrrrrrrk..",
    "....krrrrrrrrk..",
    "....kkkkkkkkkk.."
  ],
  "paper": [
    ".....kk.kk......",
    "....kwwkwwk.kk..",
    "....kwwkwwkkwwk.",
    ".kk.kwwkwwkwwwk.",
    "kwwkkwwkwwkwwk..",
    "kwwkkwwkwwkwwk..",
    "kwwwkwwwwwwwwk..",
    ".kwwwwwwwwwwwk..",
    ".kwwwwwwwwwwwk..",
    "..kwwwwwwwwwgk..",
    "..kwwwwwwwwggk..",
    "...kwwwwwwggk...",
    "...kggggggggk...",
    "...krrrrrrrrk...",
    "...krrrrrrrrk...",
    "...kkkkkkkkkk..."
  ],
  "scissors": [
    "...kk...kk......",
    "..kwwk.kwwk.....",
    "..kwwk.kwwk.....",
    "..kwwk.kwwk.....",
    "..kwwk.kwwk.....",
    "..kwwkkwwkk.....",
    ".kkwwwwwwwwk....",
    "kwwkwwwwwwwwk...",
    "kwwkwwwwwwwgk...",
    "kwwwwwwwwwwgk...",
    ".kwwwwwwwwggk...",
    "..kwwwwwwggk....",
    "..kggggggggk....",
    "..krrrrrrrrk....",
    "..krrrrrrrrk....",
    "..kkkkkkkkkk...."
  ]
}

const FONT: Record<string, string> = {
  "A": ".###.#...##...#######...##...##...#",
  "C": ".#####....#....#....#....#.....####",
  "D": "####.#...##...##...##...##...#####.",
  "E": "######....#....####.#....#....#####",
  "F": "######....#....####.#....#....#....",
  "G": ".#####....#....#.####...##...#.###.",
  "H": "#...##...##...#######...##...##...#",
  "I": "#####..#....#....#....#....#..#####",
  "K": "#...##..#.#.#..##...#.#..#..#.#...#",
  "L": "#....#....#....#....#....#....#####",
  "N": "#...###..##.#.##..###...##...##...#",
  "O": ".###.#...##...##...##...##...#.###.",
  "P": "####.#...##...#####.#....#....#....",
  "R": "####.#...##...#####.#.#..#..#.#...#",
  "S": ".#####....#.....###.....#....#####.",
  "T": "#####..#....#....#....#....#....#..",
  "U": "#...##...##...##...##...##...#.###.",
  "V": "#...##...##...##...#.#.#..#.#...#..",
  "W": "#...##...##...##.#.##.#.###.###...#",
  "Y": "#...##...#.#.#...#....#....#....#..",
  "1": "..#...##....#....#....#....#...###.",
  "2": ".###.#...#....#...#...#...#...#####",
  "3": "####.....#....#.###.....#....#####.",
  "0": ".###.#...##..###.#.###..##...#.###.",
  " ": "...................................",
  "!": "..#....#....#....#....#.........#..",
  "?": ".###.#...#....#...#...#.........#.."
}

// Hand sprite. The CPU's hand is mirrored and wears a blue cuff.
export function sprite(hand: Hand, scale: number, cpu = false): string {
  let rows = ART[hand]
  if (cpu) rows = rows.map(r => [...r].reverse().join('').replaceAll('r', 'b'))
  const w = rows[0].length, h = rows.length
  let rects = ''
  rows.forEach((row, y) => {
    for (let x = 0; x < w; ) {
      const c = row[x]
      let run = 1
      while (x + run < w && row[x + run] === c) run++
      if (c !== '.') rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${PAL[c]}"/>`
      x += run
    }
  })
  return `<svg class="px" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`
}

// Pixel text with a hard drop shadow. role=img so screen readers and tests read the words.
export function ptext(text: string, scale: number, color = '#ffd23f', shadow = '#0d0b1a'): string {
  let s = '', c = ''
  let cx = 0
  for (const ch of text) {
    const g = FONT[ch] ?? FONT[' ']
    for (let i = 0; i < 35; i++) {
      if (g[i] !== '#') continue
      const x = cx + (i % 5), y = Math.floor(i / 5)
      c += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1"/>`
      for (const [dx, dy] of [[2, 1], [1, 2], [2, 2]]) s += `<rect x="${x + dx}" y="${y + dy}" width="1" height="1"/>`
    }
    cx += 6
  }
  const w = cx + 2, h = 9
  return `<svg class="px" role="img" aria-label="${text}" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges"><g fill="${shadow}">${s}</g><g fill="${color}">${c}</g></svg>`
}
