// Sparks: coloured sparks flung around the centre by the spectrum peaks.
// One of parrotify's original visualizers (moved here from the built-in presets).
parrotify.register({
  trails: true,
  draw(ctx, f) {
    const { levels, w, h, time: now, bass } = f
    const n = levels.length
    const cx = w / 2
    const cy = h / 2
    for (let i = 0; i < n; i++) {
      const amp = levels[i]
      if (amp < 0.05) continue
      const ang = (i / n) * Math.PI * 2 + now * (0.6 + bass)
      const dist = (0.15 + amp * 0.85) * Math.min(w, h) * 0.48
      const x = cx + Math.cos(ang) * dist
      const y = cy + Math.sin(ang) * dist
      const hue = (i * 5 + now * 80 + bass * 100) % 360
      ctx.beginPath()
      ctx.arc(x, y, 1.2 + amp * 7, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${hue}, 95%, ${60 + amp * 25}%, ${0.5 + amp * 0.5})`
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.9)`
      ctx.shadowBlur = 8 + amp * 18
      ctx.fill()
      // trail streak toward the centre
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(ang) * dist * 0.4, cy + Math.sin(ang) * dist * 0.4)
      ctx.lineTo(x, y)
      ctx.strokeStyle = `hsla(${hue}, 90%, 55%, ${0.15 + amp * 0.35})`
      ctx.lineWidth = 1 + amp * 2
      ctx.stroke()
    }
  },
})
