// Horizon: A glowing horizon line with a reflected spectrum.
// One of parrotify's original visualizers (moved here from the built-in presets).
parrotify.register({
  trails: true,
  draw(ctx, f) {
    const mode = 'horizon'
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
    // glowing horizon line + reflections
    const horizon = h * 0.55
    ctx.beginPath()
    for (let x = 0; x <= w; x += 3) {
      const i = Math.floor((x / w) * (n - 1))
      const amp = levels[i] || 0.1
      const y = horizon - amp * h * 0.35 - Math.sin(x * 0.02 - now * 2) * 8 * bass
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = `rgba(${rgb}, 0.9)`
    ctx.lineWidth = 2.5
    ctx.shadowColor = soft
    ctx.shadowBlur = 20
    ctx.stroke()
    ctx.shadowBlur = 0
    // reflection
    ctx.beginPath()
    for (let x = 0; x <= w; x += 3) {
      const i = Math.floor((x / w) * (n - 1))
      const amp = levels[i] || 0.1
      const y = horizon + amp * h * 0.28 + Math.sin(x * 0.02 - now * 2) * 6 * bass
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = `rgba(${rgb}, 0.35)`
    ctx.lineWidth = 1.5
    ctx.stroke()
    const g = ctx.createLinearGradient(0, 0, 0, horizon)
    g.addColorStop(0, `rgba(${rgb}, 0.05)`)
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, horizon)
  },
})
