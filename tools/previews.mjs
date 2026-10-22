// Renders visualizers/<id>/preview.png: each visualizer runs ~1.5 s on an animated test
// spectrum in Chromium, like in the player's sandbox. Needs: npm install && npx playwright install chromium
// Usage: node tools/previews.mjs [id …]   (default: all)
import { chromium } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'

const root = new URL('..', import.meta.url).pathname
const ids = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(root + 'visualizers')
const W = 480
const H = 270

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H } })
await page.setContent(`<body style="margin:0;background:#0b0a12"><canvas id="c" width="${W}" height="${H}"></canvas></body>`)
for (const id of ids) {
  const code = readFileSync(`${root}visualizers/${id}/visualizer.js`, 'utf8')
  const meta = JSON.parse(readFileSync(`${root}visualizers/${id}/meta.json`, 'utf8'))
  await page.evaluate(({ code, trails, W, H }) => {
    const ctx = document.getElementById('c').getContext('2d')
    ctx.fillStyle = '#0b0a12'
    ctx.fillRect(0, 0, W, H)
    let vis = null
    const api = { register: (v) => { vis = v } }; new Function('parrotify', 'piratify', code)(api, api)
    // 90 frames of a moving spectrum: strong bass, falling towards the highs, beating
    for (let f = 0; f < 90; f++) {
      const t = 3 + f / 60
      const lv = Float32Array.from({ length: 64 }, (_, i) =>
        Math.max(0.04, (0.95 - i / 75) * (0.6 + 0.4 * Math.abs(Math.sin(t * 2.2 + i * 0.35))) * (i < 6 ? ((t * 2) % 1 < 0.08 ? 1.15 : 0.55) : 1)))
      const bass = (lv[0] + lv[1] + lv[2] + lv[3]) / 4
      const mid = (lv[16] + lv[20] + lv[24]) / 3
      const high = (lv[40] + lv[48] + lv[56]) / 3
      const energy = bass * 0.5 + mid * 0.3 + high * 0.2
      if (trails || vis.trails) {
        ctx.fillStyle = `rgba(10, 7, 18, ${0.22 + (1 - energy) * 0.12})`
        ctx.fillRect(0, 0, W, H)
      } else {
        ctx.fillStyle = '#0b0a12'
        ctx.fillRect(0, 0, W, H)
      }
      ctx.save()
      vis.draw(ctx, { levels: lv, w: W, h: H, time: t, bass, mid, high, energy,
        rgb: '100, 220, 120', soft: '#8be89c', accentRgb: '155, 92, 255', playing: true })
      ctx.restore()
    }
  }, { code, trails: !!meta.trails, W, H })
  await page.locator('#c').screenshot({ path: `${root}visualizers/${id}/preview.png` })
  console.log('preview', id)
}
await browser.close()
