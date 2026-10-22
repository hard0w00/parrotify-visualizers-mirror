// Fireflies: Drifting lights, each glowing with its own frequency band.
// One of parrotify's original visualizers (moved here from the built-in presets).
parrotify.register({
  trails: true,
  draw(ctx, f) {
    const mode = 'fireflies'
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
    // drifting lights; each glows with its own frequency band
    for (let i = 0; i < 48; i++) {
      const sp = 0.05 + (i % 7) * 0.012
      const x = (Math.sin(now * sp + i * 1.7) * 0.45 + 0.5) * w
      const y = (Math.cos(now * sp * 1.3 + i * 2.3) * 0.4 + 0.5) * h
      const amp = levels[(i * 5) % n]
      const r = 2 + amp * 9
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2)
      g.addColorStop(0, `rgba(${rgb}, ${0.12 + amp * 0.35})`)
      g.addColorStop(1, `rgba(${rgb}, 0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r * 2.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(255, 255, 240, ${0.3 + amp * 0.7})`
      ctx.beginPath()
      ctx.arc(x, y, Math.max(0.8, r * 0.35), 0, Math.PI * 2)
      ctx.fill()
    }
  },
})
