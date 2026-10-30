// Renders preview.png, and with --gif an animated preview.gif, in real Chromium/WebGL.
// Usage: node tools/previews.mjs [--gif] [id …]   (default: all)
import { chromium } from '@playwright/test'
import { readFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseGLB } from './glb-runtime.mjs'

const root = new URL('..', import.meta.url).pathname
const index = JSON.parse(readFileSync(root + 'index.json', 'utf8'))
const args = process.argv.slice(2)
const gif = args.includes('--gif')
const ids = args.filter((a) => a !== '--gif')
const visualizers = ids.length ? ids.map((id) => {
  const visualizer = index.visualizers.find((v) => v.id === id)
  if (!visualizer) throw new Error(`unknown visualizer: ${id}`)
  return visualizer
}) : index.visualizers
const W = gif ? 320 : 480
const H = gif ? 180 : 270
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })

try {
  for (const v of visualizers) {
    const dir = v.entry.slice(0, -'visualizer.js'.length)
    const code = readFileSync(root + v.entry, 'utf8')
    const assets = Object.fromEntries((v.assets || []).map((a) => [a.path.split('/').pop(), readFileSync(root + a.path).toString('base64')]))
    const page = await browser.newPage({ viewport: { width: W, height: H } })
    try {
      await page.setContent(`<body style="margin:0;background:#0b0a12"><canvas id="c" width="${W}" height="${H}"></canvas></body>`)
      await page.evaluate(async ({ code, assets, parser, W, H }) => {
        const canvas = document.getElementById('c')
        const files = Object.fromEntries(Object.entries(assets).map(([name, b64]) => {
          const raw = atob(b64), bytes = new Uint8Array(raw.length)
          for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
          return [name, bytes.buffer]
        }))
        let vis = null
        const pending = []
        const loadGLB = new Function(`return (${parser})`)()
        const api = { register: (v) => { vis = v }, asset: (n) => files[n] || null,
          loadGLB: (n) => { const p = loadGLB(files[n]); pending.push(p); return p } }
        new Function('parrotify', 'piratify', code)(api, api)
        if (!vis) throw new Error('visualizer did not register')
        const webgl = !!vis.webgl
        const context = canvas.getContext(webgl ? 'webgl2' : '2d', { alpha: false, premultipliedAlpha: false })
        if (!context) throw new Error(webgl ? 'no WebGL2 context' : 'no 2D context')
        if (webgl) vis.init?.(context)
        await Promise.all(pending)
        const cover = document.createElement('canvas')
        cover.width = cover.height = 512
        const cc = cover.getContext('2d')
        const gradient = cc.createLinearGradient(0, 0, 512, 512)
        gradient.addColorStop(0, '#ff4f9a'); gradient.addColorStop(0.5, '#5b45b9'); gradient.addColorStop(1, '#35d6cf')
        cc.fillStyle = gradient; cc.fillRect(0, 0, 512, 512)
        cc.fillStyle = 'rgba(5, 5, 20, .55)'; cc.beginPath(); cc.arc(256, 256, 155, 0, Math.PI * 2); cc.fill()
        cc.fillStyle = '#fff'; cc.font = 'bold 90px sans-serif'; cc.textAlign = 'center'; cc.fillText('P', 256, 290)
        const dpr = webgl ? Math.min(1, vis.maxPixelRatio || 1) : 1
        canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr)
        window.drawPreviewFrame = (frame, total, fps) => {
          const t = 3 + frame / fps
          const levels = Float32Array.from({ length: 64 }, (_, i) =>
            Math.max(0.04, (0.95 - i / 75) * (0.6 + 0.4 * Math.abs(Math.sin(t * 2.2 + i * 0.35))) * (i < 6 ? ((t * 2) % 1 < 0.16 ? 1.15 : 0.55) : 1)))
          const bass = (levels[0] + levels[1] + levels[2] + levels[3]) / 4
          const mid = (levels[16] + levels[20] + levels[24]) / 3
          const high = (levels[40] + levels[48] + levels[56]) / 3
          const energy = bass * 0.5 + mid * 0.3 + high * 0.2
          const f = { levels, w: W, h: H, pw: canvas.width, ph: canvas.height, time: t, bass, mid, high, energy,
            rgb: '100, 220, 120', soft: '#8be89c', accentRgb: '155, 92, 255', playing: true, cover,
            beat: frame % Math.round(fps * 2) === 0, beats: Math.floor(frame / Math.round(fps * 2)) }
          if (webgl) {
            context.viewport(0, 0, canvas.width, canvas.height)
            vis.draw(context, f)
            const error = context.getError()
            if (error) throw new Error(`WebGL error ${error}`)
          } else {
            context.setTransform(1, 0, 0, 1, 0, 0)
            if (vis.trails) { context.fillStyle = 'rgba(10,7,18,.25)'; context.fillRect(0, 0, W, H) }
            else { context.fillStyle = '#0b0a12'; context.fillRect(0, 0, W, H) }
            context.save(); vis.draw(context, f); context.restore()
          }
        }
      }, { code, assets, parser: parseGLB.toString(), W, H })
      const frames = gif ? 36 : 90
      const fps = gif ? 12 : 60
      const temp = gif ? join(tmpdir(), `parrotify-preview-${process.pid}-${v.id}`) : ''
      if (gif) mkdirSync(temp, { recursive: true })
      for (let f = 0; f < frames; f++) {
        await page.evaluate(({ f, frames, fps }) => window.drawPreviewFrame(f, frames, fps), { f, frames, fps })
        if (gif) await page.locator('#c').screenshot({ path: join(temp, `frame-${String(f).padStart(3, '0')}.png`) })
      }
      await page.locator('#c').screenshot({ path: root + dir + 'preview.png' })
      if (gif) {
        const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(fps), '-i', join(temp, 'frame-%03d.png'),
          '-filter_complex', 'split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer', '-loop', '0', root + dir + 'preview.gif'], { stdio: 'inherit' })
        rmSync(temp, { recursive: true, force: true })
        if (result.status !== 0) throw new Error(`ffmpeg failed for ${v.id}`)
      }
      console.log(`preview${gif ? ' + gif' : ''} ${v.id}`)
    } catch (e) {
      throw new Error(`${v.id}: ${e.message || e}`, { cause: e })
    } finally {
      await page.close()
    }
  }
} finally {
  await browser.close()
}
