// Dots: one glowing dot per band, floating as high and as big as the band is loud.
// One of piratify's original visualizers (moved here from the built-in presets).
piratify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb } = f
    const n = levels.length
    const mid = h * 0.5
    const maxUp = Math.max(0, mid - 10)
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) / n) * w
      const y = mid - levels[i] * maxUp * 0.9
      const r = Math.min(2 + levels[i] * 8, maxUp * 0.15)
      ctx.beginPath()
      ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${rgb}, ${0.35 + levels[i] * 0.55})`
      ctx.fill()
    }
  },
})
