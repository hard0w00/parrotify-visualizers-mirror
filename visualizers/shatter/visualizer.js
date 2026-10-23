// Shatter: Shards bursting out of the centre on every beat.
// One of parrotify's original visualizers (moved here from the built-in presets).
parrotify.register({
  trails: true,
  draw(ctx, f) {
    const mode = 'shatter'
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
    const cx = w / 2, cy = h / 2
    const shards = 24
    for (let i = 0; i < shards; i++) {
      const amp = levels[Math.floor((i / shards) * n)] || 0.1
      const ang = (i / shards) * Math.PI * 2 + now * (0.3 + bass * 0.5)
      const dist = (0.15 + amp * 0.7) * Math.min(w, h) * 0.45
      const x = cx + Math.cos(ang) * dist
      const y = cy + Math.sin(ang) * dist
      const size = 8 + amp * 36
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(ang + now)
      ctx.beginPath()
      ctx.moveTo(0, -size)
      ctx.lineTo(size * 0.7, size * 0.5)
      ctx.lineTo(-size * 0.7, size * 0.5)
      ctx.closePath()
      const hue = (i * 15 + now * 50) % 360
      ctx.fillStyle = `hsla(${hue}, 90%, ${50 + amp * 20}%, ${0.35 + amp * 0.45})`
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.7)`
      ctx.shadowBlur = 10
      ctx.fill()
      ctx.restore()
    }
    ctx.shadowBlur = 0
  },
})
