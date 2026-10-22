// node --test tools/test.mjs — every visualizer registers, draws without errors and only
// with finite numbers; index.json matches the files.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const root = new URL('..', import.meta.url).pathname
const index = JSON.parse(readFileSync(root + 'index.json', 'utf8'))

// minimal canvas context recording calls (like the sandbox gives a real one)
function fakeCtx() {
  const calls = []
  const grad = { addColorStop() {} }
  const ctx = new Proxy({}, {
    get(t, k) {
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad
      if (k in t) return t[k]
      return (...a) => {
        calls.push(k)
        for (const v of a) if (typeof v === 'number') assert.ok(Number.isFinite(v), `${String(k)} got ${v}`)
      }
    },
    set(t, k, v) { t[k] = v; return true },
  })
  return { ctx, calls }
}

// the frame the sandbox passes to draw()
function frame(levels, w = 640, h = 360) {
  const bass = (levels[0] + levels[1] + levels[2] + levels[3]) / 4
  const mid = (levels[16] + levels[20] + levels[24]) / 3
  const high = (levels[40] + levels[48] + levels[56]) / 3
  return { levels, w, h, time: 12.5, bass, mid, high, energy: bass * 0.5 + mid * 0.3 + high * 0.2,
    rgb: '100, 220, 120', soft: '#8be89c', accentRgb: '155, 92, 255', playing: true }
}

function load(code) {
  let vis = null
  new Function('parrotify', code)({ register: (v) => { vis = v } })
  return vis
}

for (const v of index.visualizers) {
  test(`${v.id} matches index.json and draws`, () => {
    const code = readFileSync(root + v.entry)
    assert.equal(createHash('sha256').update(code).digest('hex'), v.sha256, 'run node tools/build-index.mjs')
    const vis = load(code.toString())
    assert.ok(vis && typeof vis.draw === 'function', 'parrotify.register({ draw }) missing')
    const { ctx, calls } = fakeCtx()
    for (const lv of [new Float32Array(64), new Float32Array(64).fill(1), Float32Array.from({ length: 64 }, (_, i) => i / 63)]) {
      vis.draw(ctx, frame(lv))
      vis.draw(ctx, frame(lv, 4, 4)) // tiny canvas
    }
    assert.ok(calls.length > 3, `only ${calls.length} drawing calls`)
  })
}
