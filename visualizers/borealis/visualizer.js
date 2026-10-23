// Borealis: Northern lights drifting across the sky.
// One of parrotify's original visualizers (moved here from the built-in presets).
parrotify.register({
  trails: true,
  draw(ctx, f) {
    const mode = 'borealis'
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
    for (let band = 0; band < 7; band++) {
      ctx.beginPath()
      for (let x = 0; x <= w; x += 5) {
        const i = Math.floor((x / w) * (n - 1))
        const amp = levels[i] || 0.1
        const y =
          h * (0.25 + band * 0.07) +
          Math.sin(x * 0.008 - now * (0.8 + band * 0.15) + band * 1.2) * (18 + amp * 55) +
          Math.cos(x * 0.015 + now * 0.5) * (10 + bass * 20)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      const hue = (160 + band * 18 + now * 12 + bass * 50) % 360
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, `hsla(${hue}, 95%, 60%, ${0.1 + ampSafe(band) * 0.08})`)
      g.addColorStop(0.55, `hsla(${hue + 30}, 90%, 50%, ${0.04 + bass * 0.06})`)
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.fill()
    }
  },
})
