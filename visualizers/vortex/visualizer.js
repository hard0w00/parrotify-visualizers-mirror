// Vortex: four spiral arms whirling out of the centre, faster with the bass.
// One of piratify's original visualizers (moved here from the built-in presets).
piratify.register({
  trails: true,
  draw(ctx, f) {
    const { levels, w, h, time: now, bass } = f
    const n = levels.length
    const cx = w / 2
    const cy = h / 2
    ctx.lineWidth = 2
    ctx.shadowBlur = 10
    for (let arm = 0; arm < 4; arm++) {
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const t0 = i / (n - 1)
        const ang = t0 * Math.PI * 6 - now * (1.2 + bass) + arm * (Math.PI / 2)
        const rad = t0 * Math.min(w, h) * 0.48 * (0.7 + levels[i] * 0.5)
        const x = cx + Math.cos(ang) * rad
        const y = cy + Math.sin(ang) * rad
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      const hue = (now * 30 + arm * 70) % 360
      ctx.strokeStyle = `hsla(${hue}, 95%, 60%, 0.65)`
      ctx.shadowColor = `hsla(${hue}, 100%, 55%, 0.8)`
      ctx.stroke()
    }
  },
})
