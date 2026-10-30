// Black Hole: a black hole with a swirling, tilted accretion disk. Particles circle faster the
// closer they are, the bass feeds the hole and flares the disk, a thin photon ring glows around it.
const N = 600
const parts = []
let lastTime = 0

parrotify.register({
  trails: false,
  color: '#ff9a3c',
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, time, bass, energy } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    if (parts.length === 0) {
      let s = 12345
      for (let i = 0; i < N; i++) {
        s = (s * 16807) % 2147483647
        const r = 1.2 + ((s % 1000) / 1000) * 2.8
        parts.push({ r, a: (s % 6283) / 1000, band: i % 64 })
      }
    }
    const cx = w / 2
    const cy = h / 2
    const unit = Math.min(w, h) * 0.12 * (1 + bass * 0.1)
    const tilt = 0.28
    const glow = ctx.createRadialGradient(cx, cy, unit * 0.8, cx, cy, unit * 5)
    glow.addColorStop(0, `rgba(${rgb}, ${0.25 + energy * 0.3})`)
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)
    // particles behind the hole first (upper half of the ellipse), then the hole, then the front
    const drawHalf = (back) => {
      for (const p of parts) {
        const sy = Math.sin(p.a)
        if ((sy < 0) !== back) continue
        const v = levels[p.band]
        const r = p.r * unit * (1 + v * 0.08)
        const x = cx + Math.cos(p.a) * r
        const y = cy + sy * r * tilt
        const heat = 1 - (p.r - 1.2) / 2.8
        ctx.fillStyle = heat > 0.6 ? `rgba(255, 240, 210, ${0.5 + v * 0.5})` : `rgba(${heat > 0.3 ? rgb : accentRgb}, ${0.35 + v * 0.6})`
        const s = 1 + v * 2 + heat
        ctx.fillRect(x - s / 2, y - s / 2, s, s)
      }
    }
    for (const p of parts) p.a += dt * (1.2 + bass * 2) / Math.pow(p.r, 1.5)
    drawHalf(true)
    // the light bent over the top of the hole (lensed back of the disk)
    ctx.strokeStyle = `rgba(${rgb}, ${0.3 + bass * 0.4})`
    ctx.lineWidth = unit * 0.25
    ctx.beginPath()
    ctx.ellipse(cx, cy, unit * 1.5, unit * 1.25, 0, Math.PI, 0)
    ctx.stroke()
    ctx.fillStyle = 'rgba(0, 0, 0, 1)'
    ctx.beginPath()
    ctx.arc(cx, cy, unit, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = `rgba(255, 230, 200, ${0.6 + bass * 0.4})`
    ctx.lineWidth = 1.5
    ctx.shadowColor = `rgba(${rgb}, 1)`
    ctx.shadowBlur = 10 + bass * 20
    ctx.beginPath()
    ctx.arc(cx, cy, unit * 1.03, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0
    drawHalf(false)
  },
})
