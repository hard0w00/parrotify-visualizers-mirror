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
  ctx.canvas = { width: 640, height: 360 }
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

// a WebGL context that accepts every call (shaders compile, uniforms exist) and checks numbers
function fakeGL() {
  const calls = []
  const gl = new Proxy({}, {
    get(t, k) {
      if (typeof k === 'string' && /^[A-Z_0-9]+$/.test(k)) return k // constants
      if (k === 'getShaderParameter' || k === 'getProgramParameter') return () => true
      if (k === 'getAttribLocation') return () => 0
      return (...a) => {
        calls.push(k)
        for (const v of a) if (typeof v === 'number') assert.ok(Number.isFinite(v), `${String(k)} got ${v}`)
        return {}
      }
    },
  })
  return { gl, calls }
}

// the files a visualizer lists, as the sandbox hands them over (name → ArrayBuffer)
function assetsOf(v) {
  return Object.fromEntries((v.assets || []).map((a) => {
    const b = readFileSync(root + a.path)
    assert.equal(createHash('sha256').update(b).digest('hex'), a.sha256, `${a.path}: run node tools/build-index.mjs`)
    return [a.path.split('/').pop(), b.buffer.slice(b.byteOffset, b.byteOffset + b.length)]
  }))
}

function load(code, assets = {}) {
  let vis = null
  new Function('parrotify', code)({ register: (v) => { vis = v }, asset: (n) => assets[n] || null, loadGLB: () => new Promise(() => {}) })
  return vis
}

for (const v of index.visualizers) {
  test(`${v.id} matches index.json and draws`, () => {
    const code = readFileSync(root + v.entry)
    assert.equal(createHash('sha256').update(code).digest('hex'), v.sha256, 'run node tools/build-index.mjs')
    const vis = load(code.toString(), assetsOf(v))
    assert.ok(vis && typeof vis.draw === 'function', 'parrotify.register({ draw }) missing')
    if (vis.webgl) {
      const { gl, calls } = fakeGL()
      vis.init?.(gl)
      for (const [i, lv] of [new Float32Array(64), new Float32Array(64).fill(1)].entries()) {
        vis.draw(gl, { ...frame(lv), pw: 640, ph: 360, beat: i === 1, beats: i * 4 })
      }
      assert.ok(calls.includes('drawArrays'), 'nothing drawn')
      return
    }
    const { ctx, calls } = fakeCtx()
    const cover = { width: 512, height: 512 } // the track's cover (an ImageBitmap in the sandbox)
    for (const lv of [new Float32Array(64), new Float32Array(64).fill(1), Float32Array.from({ length: 64 }, (_, i) => i / 63)]) {
      vis.draw(ctx, frame(lv))
      vis.draw(ctx, { ...frame(lv), cover, beat: true, beats: 2 })
      vis.draw(ctx, frame(lv, 4, 4)) // tiny canvas
    }
    assert.ok(calls.length > 3, `only ${calls.length} drawing calls`)
  })
}
