// Waves: Layered waves riding on the spectrum.
// One of piratify's original visualizers (moved here from the built-in presets).
piratify.register({
  trails: false,
  draw(ctx, f) {
    const mode = 'waves'
    const { levels, w, h, rgb, soft } = f
    const n = levels.length
    const pad = 10
    const mid = h * 0.5
    const maxUp = mid - pad
    const maxDown = h - mid - pad
    const now = f.time
    const bass = f.bass
    const midE = f.mid
    const high = f.high
    const energy = f.energy
    const ampSafe = (i) => levels[i % n] || 0.1
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * w
      const y = mid - levels[i] * maxUp * 0.9
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    for (let i = n - 1; i >= 0; i--) {
      const x = (i / (n - 1)) * w
      const y = mid + levels[i] * maxDown * 0.55
      ctx.lineTo(x, y)
    }
    ctx.closePath()
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, `rgba(${rgb}, 0.55)`)
    g.addColorStop(1, `rgba(${rgb}, 0.05)`)
    ctx.fillStyle = g
    ctx.fill()
    ctx.strokeStyle = soft
    ctx.lineWidth = 1.5
    ctx.stroke()
  },
})
