// Lightning: a storm. Strong beats strike a forked bolt from the clouds, which lights the sky
// and fades; the highs flicker in the clouds.
const bolts = []
let lastBass = 0
let flash = 0
let lastTime = 0

function bolt(x0, y0, x1, y1, spread, depth, out) {
  if (depth === 0) {
    out.push([x0, y0, x1, y1])
    return
  }
  const mx = (x0 + x1) / 2 + (Math.random() - 0.5) * spread
  const my = (y0 + y1) / 2 + (Math.random() - 0.5) * spread * 0.3
  bolt(x0, y0, mx, my, spread / 2, depth - 1, out)
  bolt(mx, my, x1, y1, spread / 2, depth - 1, out)
  if (depth > 2 && Math.random() < 0.35) { // a fork
    bolt(mx, my, mx + (Math.random() - 0.5) * spread * 2, my + Math.abs(y1 - y0) * 0.4, spread / 2, depth - 2, out)
  }
}

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { w, h, rgb, soft, time, bass, high } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    if (bass - lastBass > 0.08 && bass > 0.4 && bolts.length < 4) {
      const segs = []
      const x = w * (0.15 + Math.random() * 0.7)
      bolt(x, h * 0.12, x + (Math.random() - 0.5) * w * 0.3, h * (0.75 + Math.random() * 0.25), w * 0.18, 6, segs)
      bolts.push({ segs, life: 1 })
      flash = Math.max(flash, bass)
    }
    lastBass = bass
    flash = Math.max(0, flash - dt * 3)
    if (flash > 0) {
      ctx.fillStyle = `rgba(${rgb}, ${flash * 0.25})`
      ctx.fillRect(0, 0, w, h)
    }
    // clouds: soft blobs along the top, flickering with the highs
    for (let c = 0; c < 9; c++) {
      const flick = high * (0.5 + 0.5 * Math.sin(time * 13 + c * 2.1))
      ctx.fillStyle = `rgba(${rgb}, ${0.06 + flick * 0.12})`
      ctx.beginPath()
      ctx.ellipse(((c + 0.5) * w) / 9, h * 0.08, Math.max(0.5, w * 0.09), Math.max(0.5, h * 0.08), 0, 0, Math.PI * 2)
      ctx.fill()
    }
    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i]
      b.life -= dt * 1.2
      if (b.life <= 0) {
        bolts.splice(i, 1)
        continue
      }
      for (const [width, style] of [[6, `rgba(${rgb}, ${b.life * 0.25})`], [1.6, soft]]) {
        ctx.strokeStyle = style
        ctx.globalAlpha = (width > 2 ? 1 : b.life) * (0.75 + 0.25 * Math.sin(time * 40)) // flicker
        ctx.lineWidth = width
        ctx.beginPath()
        for (const [x0, y0, x1, y1] of b.segs) {
          ctx.moveTo(x0, y0)
          ctx.lineTo(x1, y1)
        }
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
  },
})
