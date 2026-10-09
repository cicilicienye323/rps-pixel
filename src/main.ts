import './style.css'
import { cpuHand, formatTime, isOver, newTrx, outcome, score, type Hand, type Outcome } from './game'
import { ptext, sprite } from './sprites'

type Mode = 'CAMERA' | 'BUTTONS'
type Round = { you: Hand; cpu: Hand; outcome: Outcome }
type Match = { mode: Mode; rounds: Round[]; trx: string; startedAt: Date }

const app = document.querySelector<HTMLDivElement>('#app')!
let match: Match

const NAME: Record<Hand, string> = { rock: 'Rock', paper: 'Paper', scissors: 'Scissors' }
const VERB: Record<Hand, string> = { rock: 'Rock crushes scissors', paper: 'Paper covers rock', scissors: 'Scissors cut paper' }
const NOT_AVAILABLE = 'Camera not available. You can still play with the buttons below.'

function show(html: string, cls = '') {
  app.innerHTML = `<div class="screen ${cls}">${html}</div>`
}

function on(label: string, fn: () => void) {
  app.querySelectorAll<HTMLButtonElement>(`[data-act="${label}"]`).forEach(b => b.addEventListener('click', fn, { once: true }))
}

function hud(): string {
  const s = score(match.rounds)
  const pips = (n: number) => [0, 1, 2].map(i => `<i class="pip${i < n ? ' on' : ''}"></i>`).join('')
  return `<div class="hud" aria-label="Score ${s.you} : ${s.cpu}">
    <div class="side p1"><span class="tag">1P YOU</span><span class="pips">${pips(s.you)}</span></div>
    <div class="round">R${match.rounds.length + 1}</div>
    <div class="side p2"><span class="tag">CPU 2P</span><span class="pips">${pips(s.cpu)}</span></div>
  </div>`
}

function newMatch(mode: Mode) {
  const startedAt = new Date()
  match = { mode, rounds: [], trx: newTrx(startedAt), startedAt }
}

// ---------- start ----------
function showStart() {
  show(`
    <div class="center" style="margin-top:18px">${ptext('ROCK', 5)}${ptext('PAPER', 5)}${ptext('SCISSORS', 5)}</div>
    <div class="row" style="align-items:flex-end">${sprite('rock', 5)}${sprite('paper', 5)}${sprite('scissors', 5)}</div>
    <div class="center">${ptext('1P VS CPU', 3, '#fff8f0')}<div class="small">First to 3 wins</div></div>
    <div class="box">Show your hand to the camera to play. The video stays in this browser. Nothing is sent or recorded.</div>
    <button class="btn wide" data-act="camera">Use camera</button>
    <button class="btn ghost wide" data-act="buttons">Play with buttons</button>`)
  on('camera', useCamera)
  on('buttons', () => { newMatch('BUTTONS'); showPick() })
}

// ---------- buttons mode ----------
function showPick(warn = '') {
  show(`${hud()}
    ${warn ? `<div class="box warn">${warn}</div>` : ''}
    <div class="center" style="margin-top:12px">${ptext('PICK', 4)}</div>
    <div class="row">${(['rock', 'paper', 'scissors'] as Hand[]).map(h =>
      `<button class="pick" data-act="${h}">${sprite(h, 4)}<span>${NAME[h]}</span></button>`).join('')}</div>
    <div class="small">Tap a hand to throw it</div>`)
  for (const h of ['rock', 'paper', 'scissors'] as Hand[]) on(h, () => play(h))
}

// ---------- round result ----------
function play(you: Hand) {
  const cpu = cpuHand()
  match.rounds.push({ you, cpu, outcome: outcome(you, cpu) })
  showResult()
}

function showResult() {
  const r = match.rounds[match.rounds.length - 1]
  const over = isOver(match.rounds)
  const title = r.outcome === 'WIN' ? ptext('YOU WIN', 5) : r.outcome === 'LOSE' ? ptext('YOU LOSE', 5, '#e43b44') : ptext('DRAW', 5, '#b8b0c8')
  const sub = r.outcome === 'WIN' ? VERB[r.you] : r.outcome === 'LOSE' ? VERB[r.cpu] : `Score stays · next is round ${match.rounds.length + 1}`
  show(`${hud()}
    <div class="grow"></div>
    <div class="duel">
      <div>${sprite(r.you, 8)}<div class="who">1P YOU</div></div>
      ${ptext('VS', 5)}
      <div>${sprite(r.cpu, 8, true)}<div class="who">CPU 2P</div></div>
    </div>
    <div class="center" style="margin-top:24px">${title}<div class="small">${sub}</div></div>
    <div class="grow"></div>
    ${over ? '' : '<button class="btn wide" data-act="next">Next round</button>'}`)
  if (over) {
    stopCamera()
    setTimeout(showReceipt, 1500)
  } else on('next', nextRound)
}

function nextRound() {
  if (match.mode === 'CAMERA') cameraRound()
  else showPick()
}

// ---------- receipt ----------
function showReceipt() {
  const s = score(match.rounds)
  const count = (o: Outcome) => match.rounds.filter(r => r.outcome === o).length
  const cls: Record<Outcome, string> = { WIN: 'w', DRAW: 'd', LOSE: 'l' }
  const rows = match.rounds.map((r, i) =>
    `<li class="line"><span class="mini">R${i + 1} ${sprite(r.you, 2)} vs ${sprite(r.cpu, 2, true)}</span><span class="${cls[r.outcome]}">${r.outcome}</span></li>`).join('')
  show(`
    <section class="receipt" aria-label="Match receipt">
      <div class="center">${ptext('RPS ARCADE', 3, '#0d0b1a', '#b8b0c8')}<div>*** MATCH RECEIPT ***</div></div>
      <hr>
      <div class="line"><span>TRX NO</span><span>${match.trx}</span></div>
      <div class="line"><span>TIME</span><span>${formatTime(match.startedAt)}</span></div>
      <div class="line"><span>INPUT</span><span>${match.mode}</span></div>
      <hr><ul>${rows}</ul><hr>
      <div class="line"><span>ROUNDS</span><span>${match.rounds.length}</span></div>
      <div class="line"><span>WIN / DRAW / LOSE</span><span>${count('WIN')} / ${count('DRAW')} / ${count('LOSE')}</span></div>
      <div class="line tot"><span>FINAL SCORE</span><span>${s.you} : ${s.cpu}</span></div>
      <div class="line tot"><span>RESULT</span>${s.you === 3 ? '<span class="w">YOU WIN</span>' : '<span class="l">CPU WINS</span>'}</div>
      <hr>
      <div class="center">THANK YOU · PLAY AGAIN</div>
      <div class="barcode"></div>
    </section>
    <div class="row" style="margin:18px 0"><button class="btn" data-act="again">Play again</button></div>`, 'paper-wrap')
  on('again', () => {
    if (match.mode === 'CAMERA') useCamera()
    else { newMatch('BUTTONS'); showPick() }
  })
}

// ---------- camera mode ----------
let stream: MediaStream | undefined

function stopCamera() {
  stream?.getTracks().forEach(t => t.stop())
  stream = undefined
}

async function useCamera() {
  if (!navigator.mediaDevices?.getUserMedia) return cameraFailed()
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
  } catch {
    return cameraFailed()
  }
  // Model loading lands with camera mode; until then the camera path falls back.
  stopCamera()
  cameraFailed()
}

function cameraFailed() {
  stopCamera()
  newMatch('BUTTONS')
  showPick(NOT_AVAILABLE)
}

function cameraRound() {
  showPick()
}

showStart()
