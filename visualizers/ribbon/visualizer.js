// Ribbon: A ribbon twisting through the spectrum.
// One of piratify's original visualizers (moved here from the built-in presets).
piratify.register({
  trails: true,
  draw(ctx, f) {
    const mode = 'ribbon'
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
    for (let r = 0; r < 4; r++) {
      ctx.beginPath()
      const thickness = 14 + r * 6
      for (let x = 0; x <= w; x += 4) {
        const i = Math.floor((x / w) * (n - 1))
        const amp = levels[i] || 0.1
        const y = h * 0.5 + Math.sin(x * 0.012 - now * 1.4 + r * 1.5) * (30 + amp * 70 + bass * 25)
        if (x === 0) ctx.moveTo(x, y - thickness / 2)
        else ctx.lineTo(x, y - thickness / 2)
      }
      for (let x = w; x >= 0; x -= 4) {
        const i = Math.floor((x / w) * (n - 1))
        const amp = levels[i] || 0.1
        const y = h * 0.5 + Math.sin(x * 0.012 - now * 1.4 + r * 1.5) * (30 + amp * 70 + bass * 25)
        ctx.lineTo(x, y + thickness / 2)
      }
      ctx.closePath()
      const hue = (now * 40 + r * 50) % 360
      ctx.fillStyle = `hsla(${hue}, 90%, 55%, ${0.12 + r * 0.04 + energy * 0.1})`
      ctx.fill()
    }
  },
})
