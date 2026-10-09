import './style.css'
import { cpuHand, formatTime, isOver, newTrx, outcome, score, type Hand, type Outcome } from './game'
import { readFrames } from './reading'
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

function hud(round = match.rounds.length + 1): string {
  const s = score(match.rounds)
  const pips = (n: number) => [0, 1, 2].map(i => `<i class="pip${i < n ? ' on' : ''}"></i>`).join('')
  return `<div class="hud" aria-label="Score ${s.you} : ${s.cpu}">
    <div class="side p1"><span class="tag">1P YOU</span><span class="pips">${pips(s.you)}</span></div>
    <div class="round">R${round}</div>
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
  show(`${hud(match.rounds.length)}
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
// Frames go from the camera to the recognizer inside this page. Nothing is drawn out, stored or sent.
let stream: MediaStream | undefined
let cam: typeof import('./camera') | undefined
const video = Object.assign(document.createElement('video'), { muted: true, playsInline: true })
const dots = document.createElement('canvas')
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

function stopCamera() {
  stream?.getTracks().forEach(t => t.stop())
  stream = undefined
  video.srcObject = null
}

async function useCamera() {
  if (!navigator.mediaDevices?.getUserMedia) return cameraFailed()
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
  } catch {
    return cameraFailed()
  }
  video.srcObject = stream
  newMatch('CAMERA')
  showCam(`<div class="small" style="text-align:left">Loading hand reader... <span data-pct>0</span>%</div>
    <div class="meter load"><i data-bar style="width:0%"></i></div>
    <div class="small">First time only. About 20 MB, kept by your browser.</div>`, 'CAMERA ON · LOCAL ONLY')
  try {
    cam = await import('./camera')
    await cam.loadRecognizer(p => {
      app.querySelector('[data-pct]')!.textContent = String(p)
      app.querySelector<HTMLElement>('[data-bar]')!.style.width = `${p}%`
    })
  } catch {
    return cameraFailed()
  }
  cameraRound()
}

function cameraFailed() {
  stopCamera()
  newMatch('BUTTONS')
  showPick(NOT_AVAILABLE)
}

// Round screen with the live camera on top. The video element is reused across screens.
function showCam(below: string, label = 'LIVE · LOCAL ONLY') {
  show(`${hud()}<div class="cam"><span class="live">● ${label}</span><div data-video></div></div>${below}`)
  app.querySelector('[data-video]')!.append(video, dots)
  video.play().catch(() => {})
}

function drawDots(points: { x: number; y: number }[]) {
  dots.width = video.clientWidth
  dots.height = video.clientHeight
  const g = dots.getContext('2d')!
  g.clearRect(0, 0, dots.width, dots.height)
  g.fillStyle = '#63c74d'
  for (const p of points) g.fillRect(Math.round(p.x * dots.width) - 3, Math.round(p.y * dots.height) - 3, 6, 6)
}

// 10 new video frames after "GO!".
async function collect(n: number) {
  const frames = []
  let last = -1
  while (frames.length < n) {
    await new Promise(requestAnimationFrame)
    if (video.readyState < 2 || video.currentTime === last) continue
    last = video.currentTime
    const r = cam!.readVideo(video)
    drawDots(r.points)
    frames.push(r.frame)
  }
  return frames
}

async function cameraRound() {
  for (const n of ['3', '2', '1']) {
    showCam(`<div class="center" style="margin-top:6px">${ptext(n, 12)}</div><div class="small">Rock · paper · scissors...</div>`)
    await wait(1000)
  }
  showCam(`<div class="center" style="margin-top:6px">${ptext('GO!', 10)}</div><div class="small">Hold your hand still</div>`)
  const r = readFrames(await collect(10))

  if (r.kind === 'locked') {
    showCam(`<div class="read"><span>I see</span><b>${NAME[r.hand]}</b></div>
      <div class="meter"><i style="width:${r.score * 100}%"></i></div>
      <div class="read"><span class="small">Sure ${Math.round(r.score * 100)}%</span><span class="small">Locked in</span></div>`)
    await wait(1000)
    play(r.hand)
  } else if (r.kind === 'ask') {
    showCam(`<div class="read"><span>I think</span><b>${NAME[r.hand]}</b></div>
      <div class="meter unsure"><i style="width:${r.score * 100}%"></i></div>
      <div class="small">Sure ${Math.round(r.score * 100)}%</div>
      <div class="row"><button class="btn" data-act="yes">Yes</button><button class="btn ghost" data-act="retry">Retry</button></div>`)
    on('yes', () => play(r.hand))
    on('retry', cameraRound)
  } else {
    const msg = r.kind === 'nohand' ? 'No hand seen. Show your hand inside the frame.' : "Can't read your hand, show it again."
    showCam(`<div class="box warn">${msg}</div><div class="small">Restarting in 2...</div>`)
    await wait(2000)
    cameraRound()
  }
}

showStart()
