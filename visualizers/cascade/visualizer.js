// Cascade: Falling streams of light per band.
// One of parrotify's original visualizers (moved here from the built-in presets).
parrotify.register({
  trails: true,
  draw(ctx, f) {
    const mode = 'cascade'
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
    for (let col = 0; col < 20; col++) {
      const i = Math.floor((col / 20) * (n - 1))
      const amp = levels[i] || 0.1
      const x = (col / 20) * w + w / 40
      const drops = 8
      for (let d = 0; d < drops; d++) {
        const phase = (now * 0.8 + d * 0.35 - col * 0.05) % 1
        const y = phase * h
        const a = (1 - phase) * (0.2 + amp * 0.6)
        const hue = (140 + col * 8 + now * 30) % 360
        ctx.fillStyle = `hsla(${hue}, 90%, 60%, ${a})`
        ctx.fillRect(x - 2, y, 4 + amp * 6, 10 + amp * 20)
      }
    }
  },
})
