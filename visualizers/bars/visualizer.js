// Bars: classic spectrum bars rising from the middle line over a faint reflection.
// One of piratify's original visualizers (moved here from the built-in presets).
piratify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb } = f
    const n = levels.length
    const pad = 10
    const mid = h * 0.5
    const maxUp = Math.max(0, mid - pad)
    const maxDown = Math.max(0, h - mid - pad)
    const gap = 2
    const barW = Math.max(2, (w - gap * (n - 1)) / n)
    for (let i = 0; i < n; i++) {
      const amp = levels[i]
      const bh = amp * maxUp * 0.95
      const x = i * (barW + gap)
      const g = ctx.createLinearGradient(0, mid - bh, 0, mid + Math.min(bh * 0.4, maxDown))
      g.addColorStop(0, `rgba(${rgb}, ${0.2 + amp * 0.8})`)
      g.addColorStop(1, `rgba(${rgb}, 0.06)`)
      ctx.fillStyle = g
      ctx.fillRect(x, mid - bh, barW, bh)
      ctx.fillStyle = `rgba(${rgb}, ${0.1 + amp * 0.25})`
      ctx.fillRect(x, mid, barW, Math.min(3 + amp * 8, maxDown * 0.15))
    }
  },
})
