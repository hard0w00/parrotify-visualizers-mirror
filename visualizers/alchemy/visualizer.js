// Alchemy: rotating nested polygons with glowing, hue-cycling edges, after the Windows
// Media Player classic. One of piratify's original visualizers (moved here from the built-in presets).
piratify.register({
  trails: true,
  draw(ctx, f) {
    const { levels, w, h, time: now, bass, energy } = f
    const n = levels.length
    const maxR = Math.min(w, h) * 0.42
    ctx.translate(w / 2, h / 2)
    ctx.rotate(now * (0.4 + bass * 1.2))
    for (let ring = 0; ring < 5; ring++) {
      const sides = 3 + ring
      const amp = levels[(ring * 7) % n] || 0.2
      const rad = maxR * (0.2 + ring * 0.16) * (0.75 + amp * 0.55 + bass * 0.2)
      const hue = (now * 40 + ring * 50 + energy * 80) % 360
      ctx.beginPath()
      for (let s = 0; s <= sides; s++) {
        const a = (s / sides) * Math.PI * 2
        const wobble = 1 + Math.sin(now * 3 + s + ring) * 0.08 * amp
        const x = Math.cos(a) * rad * wobble
        const y = Math.sin(a) * rad * wobble
        if (s === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = `hsla(${hue}, 90%, ${55 + amp * 20}%, ${0.35 + amp * 0.5})`
      ctx.lineWidth = 1.5 + amp * 4
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.6)`
      ctx.shadowBlur = 12 + amp * 28
      ctx.stroke()
      if (ring % 2 === 0) {
        ctx.fillStyle = `hsla(${hue}, 85%, 50%, ${0.04 + amp * 0.08})`
        ctx.fill()
      }
    }
    // inner spark core
    ctx.beginPath()
    ctx.arc(0, 0, 6 + bass * 28, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${(now * 60) % 360}, 100%, 70%, ${0.4 + bass * 0.5})`
    ctx.shadowBlur = 30
    ctx.fill()
  },
})
