// Aurora: Soft curtains of light that sway with the music.
// One of parrotify's original visualizers (moved here from the built-in presets).
parrotify.register({
  trails: true,
  draw(ctx, f) {
    const mode = 'aurora'
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
    for (let band = 0; band < 5; band++) {
      ctx.beginPath()
      for (let x = 0; x <= w; x += 6) {
        const i = Math.floor((x / w) * (n - 1))
        const amp = levels[i] || 0.1
        const y =
          h * (0.35 + band * 0.08) +
          Math.sin(x * 0.01 - now * (1 + band * 0.2) + band) * (20 + amp * 50) +
          Math.sin(x * 0.02 + now * 0.7) * 15 * bass
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      // fill down
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      const hue = (120 + band * 30 + now * 15 + bass * 40) % 360
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, `hsla(${hue}, 90%, 55%, ${0.08 + band * 0.03})`)
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.fill()
    }
  },
})
