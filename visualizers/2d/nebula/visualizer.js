// Nebula: Glowing gas clouds that swell with the bass.
// One of parrotify's original visualizers (moved here from the built-in presets).
parrotify.register({
  trails: true,
  draw(ctx, f) {
    const mode = 'nebula'
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
    // Soft gas clouds + star speckles
    const cx = w / 2, cy = h / 2
    for (let i = 0; i < 18; i++) {
      const amp = levels[(i * 3) % n] || 0.15
      const ang = now * 0.15 + i * 0.7
      const dist = (0.1 + (i % 5) * 0.12) * Math.min(w, h) * (0.6 + amp * 0.5)
      const x = cx + Math.cos(ang) * dist
      const y = cy + Math.sin(ang * 1.3) * dist * 0.7
      const rad = 40 + amp * 120 + bass * 40
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
      const hue = (now * 20 + i * 25 + amp * 60) % 360
      g.addColorStop(0, `hsla(${hue}, 90%, 60%, ${0.12 + amp * 0.25})`)
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, rad, 0, Math.PI * 2)
      ctx.fill()
    }
    for (let i = 0; i < n; i++) {
      if (levels[i] < 0.25) continue
      const x = ((i * 97) % 1000) / 1000 * w
      const y = ((i * 57) % 1000) / 1000 * h
      ctx.fillStyle = `rgba(255,255,255,${0.2 + levels[i] * 0.6})`
      ctx.fillRect(x, y, 1.5, 1.5)
    }
  },
})
