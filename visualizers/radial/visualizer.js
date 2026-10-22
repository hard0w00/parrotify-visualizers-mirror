// Radial: 64 spectrum bars arranged in a circle (mirrored, bass at the top), around a core
// that beats with the bass; a slow rotation and a glow on the loudest bars.
piratify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, soft, time, bass } = f
    const cx = w / 2
    const cy = h / 2
    const R = Math.min(w, h) * (0.2 + bass * 0.04)
    const maxLen = Math.min(w, h) * 0.26
    const n = 128
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(time * 0.15)
    ctx.lineCap = 'round'
    ctx.lineWidth = Math.max(1, ((Math.PI * 2 * R) / n) * 0.6)
    for (let i = 0; i < n; i++) {
      const band = i < n / 2 ? i : n - 1 - i // mirrored: both halves go bass to treble
      const v = levels[band]
      const a = (i / n) * Math.PI * 2 - Math.PI / 2
      const len = 2 + v * maxLen
      ctx.strokeStyle = v > 0.6 ? `rgba(${accentRgb}, ${0.6 + v * 0.4})` : `rgba(${rgb}, ${0.35 + v * 0.6})`
      ctx.beginPath()
      ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R)
      ctx.lineTo(Math.cos(a) * (R + len), Math.sin(a) * (R + len))
      ctx.stroke()
    }
    ctx.restore()
    // core
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9)
    core.addColorStop(0, soft)
    core.addColorStop(1, `rgba(${rgb}, 0.05)`)
    ctx.fillStyle = core
    ctx.beginPath()
    ctx.arc(cx, cy, R * (0.6 + bass * 0.3), 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = `rgba(${rgb}, 0.6)`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, R * 0.92, 0, Math.PI * 2)
    ctx.stroke()
  },
})
