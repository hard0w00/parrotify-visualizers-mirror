// Mist: Slow fog that brightens with the music.
// One of piratify's original visualizers (moved here from the built-in presets).
piratify.register({
  trails: true,
  draw(ctx, f) {
    const mode = 'mist'
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
    for (let i = 0; i < 30; i++) {
      const amp = levels[(i * 2) % n] || 0.1
      const x = ((i * 137) % 1000) / 1000 * w
      const y = h * 0.3 + Math.sin(-now * 0.6 + i) * 40 + amp * h * 0.25
      const rad = 30 + amp * 90 + bass * 30
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
      const hue = (180 + i * 8 + now * 20) % 360
      g.addColorStop(0, `hsla(${hue}, 80%, 70%, ${0.08 + amp * 0.2})`)
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, rad, 0, Math.PI * 2)
      ctx.fill()
    }
    // soft floor glow
    const g2 = ctx.createLinearGradient(0, h * 0.6, 0, h)
    g2.addColorStop(0, 'transparent')
    g2.addColorStop(1, `rgba(${rgb}, ${0.08 + energy * 0.12})`)
    ctx.fillStyle = g2
    ctx.fillRect(0, h * 0.55, w, h * 0.45)
  },
})
