// Helix: two glowing strands winding down the screen, swinging wider with their bands.
// One of parrotify's original visualizers (moved here from the built-in presets).
parrotify.register({
  trails: true,
  draw(ctx, f) {
    const { levels, w, h, rgb, time: now, bass } = f
    const n = levels.length
    const pad = 10
    const cx = w / 2
    const swing = Math.min(w, h) / 360 // the old fixed sizes were made for a ~360 px high player
    for (let strand = 0; strand < 2; strand++) {
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const t0 = i / (n - 1)
        const y = pad + t0 * (h - pad * 2)
        const phase = now * 2.2 + strand * Math.PI + t0 * Math.PI * 4
        const x = cx + Math.sin(phase) * (40 + levels[i] * 90 + bass * 30) * swing
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      const hue = (now * 40 + strand * 120) % 360
      ctx.strokeStyle = `hsla(${hue}, 90%, 60%, 0.75)`
      ctx.lineWidth = 2.5
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.8)`
      ctx.shadowBlur = 12
      ctx.stroke()
    }
    ctx.shadowBlur = 0
    // rungs
    ctx.lineWidth = 1
    for (let i = 0; i < n; i += 3) {
      const t0 = i / (n - 1)
      const y = pad + t0 * (h - pad * 2)
      const amp = levels[i]
      const phase = now * 2.2 + t0 * Math.PI * 4
      const r = (40 + amp * 90) * swing
      ctx.strokeStyle = `rgba(${rgb}, ${0.15 + amp * 0.4})`
      ctx.beginPath()
      ctx.moveTo(cx + Math.sin(phase) * r, y)
      ctx.lineTo(cx + Math.sin(phase + Math.PI) * r, y)
      ctx.stroke()
    }
  },
})
