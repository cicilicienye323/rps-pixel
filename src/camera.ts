// Loaded only after "Use camera". Model and wasm come from this site's own public/mediapipe/.
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision'
import type { Frame } from './reading'

const BASE = `${import.meta.env.BASE_URL}mediapipe/`
const MODEL_BYTES = 8373440

let recognizer: GestureRecognizer | undefined

export async function loadRecognizer(onProgress: (pct: number) => void): Promise<void> {
  if (recognizer) return onProgress(100)
  const res = await fetch(`${BASE}gesture_recognizer.task`)
  if (!res.ok || !res.body) throw new Error(`model ${res.status}`)
  const total = Number(res.headers.get('content-length')) || MODEL_BYTES
  const chunks: Uint8Array[] = []
  let got = 0
  for (const reader = res.body.getReader(); ;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    got += value.length
    onProgress(Math.min(99, Math.floor((got / total) * 100)))
  }
  const model = new Uint8Array(got)
  let at = 0
  for (const c of chunks) { model.set(c, at); at += c.length }

  const vision = await FilesetResolver.forVisionTasks(`${BASE}wasm`)
  recognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: { modelAssetBuffer: model },
    runningMode: 'VIDEO',
    numHands: 1,
  })
  onProgress(100)
}

// One frame: the top gesture, or null when no hand is in view. Points are for the landmark dots.
export function readVideo(video: HTMLVideoElement): { frame: Frame; points: { x: number; y: number }[] } {
  const r = recognizer!.recognizeForVideo(video, performance.now())
  if (!r.landmarks.length) return { frame: null, points: [] }
  const top = r.gestures[0]?.[0]
  return {
    frame: top ? { category: top.categoryName, score: top.score } : { category: 'None', score: 0 },
    points: r.landmarks[0],
  }
}
