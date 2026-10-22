// Warp: a spectrum ring in the centre; every frame the previous picture is drawn back slightly
// bigger and turned, so the rings stream outwards in a spiral, like a MilkDrop feedback loop.
// The feedback lives in two offscreen canvases of our own (the sandbox's trails fade too fast).
let bufs = null
let cur = 0

function buffers(w, h) {
  if (typeof document === 'undefined') return null
  const bw = Math.max(1, Math.round(w))
  const bh = Math.max(1, Math.round(h))
  if (!bufs || bufs[0].width !== bw || bufs[0].height !== bh) {
    bufs = [0, 1].map(() => {
      const c = document.createElement('canvas')
      c.width = bw
      c.height = bh
      return c
    })
  }
  return bufs
}

function ring(ctx, f, cx, cy) {
  const { levels, w, h, time, bass, energy } = f
  const r0 = Math.min(w, h) * (0.06 + bass * 0.05)
  const hue = (time * 40) % 360
  ctx.lineWidth = 2
  ctx.strokeStyle = `hsla(${hue}, 95%, 65%, ${0.6 + energy * 0.4})`
  ctx.beginPath()
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2 + time
    const v = levels[i < 32 ? i * 2 : (64 - i) * 2 - 1] || 0
    const r = r0 + v * Math.min(w, h) * 0.1
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.stroke()
}

piratify.register({
  trails: false,
  draw(ctx, f) {
    const { w, h, time, bass, mid } = f
    const b = buffers(w, h)
    if (!b) { ring(ctx, f, w / 2, h / 2); return }
    const src = b[cur]
    const dst = b[1 - cur]
    cur = 1 - cur
    const d = dst.getContext('2d')
    d.setTransform(1, 0, 0, 1, 0, 0)
    d.clearRect(0, 0, dst.width, dst.height)
    // feedback: zoom (more with bass) and rotate (with the mids) the last frame, fading a little;
    // the centre drifts on a slow figure eight so the spiral bends
    const cx = w / 2 + Math.sin(time * 0.4) * w * 0.08
    const cy = h / 2 + Math.sin(time * 0.8) * h * 0.06
    d.save()
    d.translate(cx, cy)
    d.rotate(0.012 + (mid - 0.3) * 0.04)
    d.scale(1.025 + bass * 0.04, 1.025 + bass * 0.04)
    d.globalAlpha = 0.93
    d.drawImage(src, -cx, -cy, w, h)
    d.restore()
    ring(d, f, cx, cy)
    ctx.drawImage(dst, 0, 0, w, h)
  },
})
