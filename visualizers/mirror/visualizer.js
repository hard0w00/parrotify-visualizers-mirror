// Mirror: Spectrum bars mirrored around the middle line.
// One of piratify's original visualizers (moved here from the built-in presets).
piratify.register({
  trails: false,
  draw(ctx, f) {
    const mode = 'mirror'
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
    const gap = 2
    const barW = Math.max(2, (w - gap * (n - 1)) / n)
    for (let i = 0; i < n; i++) {
      const amp = levels[i]
      const bh = amp * (mode === 'mirror' ? Math.min(maxUp, maxDown) * 0.92 : maxUp * 0.95)
      const x = i * (barW + gap)
      const g = ctx.createLinearGradient(0, mid - bh, 0, mid + Math.min(bh * 0.4, maxDown))
      g.addColorStop(0, `rgba(${rgb}, ${0.2 + amp * 0.8})`)
      g.addColorStop(1, `rgba(${rgb}, 0.06)`)
      ctx.fillStyle = g
      ctx.fillRect(x, mid - bh, barW, bh)
      if (mode === 'mirror') {
        ctx.fillStyle = `rgba(${rgb}, ${0.12 + amp * 0.4})`
        ctx.fillRect(x, mid, barW, Math.min(bh, maxDown))
      } else {
        ctx.fillStyle = `rgba(${rgb}, ${0.1 + amp * 0.25})`
        ctx.fillRect(x, mid, barW, Math.min(3 + amp * 8, maxDown * 0.15))
      }
    }
  },
})
