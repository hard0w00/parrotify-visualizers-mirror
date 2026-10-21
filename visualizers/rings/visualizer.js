// Rings: Concentric rings, one per band.
// One of piratify's original visualizers (moved here from the built-in presets).
piratify.register({
  trails: false,
  draw(ctx, f) {
    const mode = 'rings'
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
    const cx = w / 2
    const cy = h * 0.5
    const maxR = Math.min(w, h) * 0.45
    for (let i = 0; i < 8; i++) {
      const amp = levels[i * 4] || 0.2
      const rad = Math.min(maxR, (0.15 + i * 0.1) * maxR + amp * maxR * 0.2)
      ctx.beginPath()
      ctx.arc(cx, cy, rad, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(${rgb}, ${0.15 + amp * 0.5})`
      ctx.lineWidth = 2 + amp * 3
      ctx.stroke()
    }
  },
})
