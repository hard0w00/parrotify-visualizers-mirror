// Sonar: a radar sweep circles the screen; every band is a contact at its own bearing whose
// distance from the centre is its loudness. Contacts glow when the beam passes and fade after.
piratify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, time, bass } = f
    const n = levels.length
    const cx = w / 2
    const cy = h / 2
    const R = Math.max(1, Math.min(w, h) * 0.46)
    const TAU = Math.PI * 2
    const sweep = (time * 1.4) % TAU
    ctx.strokeStyle = `rgba(${rgb}, 0.18)`
    ctx.lineWidth = 1
    for (let k = 1; k <= 4; k++) {
      ctx.beginPath()
      ctx.arc(cx, cy, (R * k) / 4, 0, TAU)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(cx - R, cy)
    ctx.lineTo(cx + R, cy)
    ctx.moveTo(cx, cy - R)
    ctx.lineTo(cx, cy + R)
    ctx.stroke()
    // the beam: a fan of lines fading behind the leading edge
    for (let s = 0; s < 24; s++) {
      const a = sweep - s * 0.03
      ctx.strokeStyle = `rgba(${rgb}, ${(0.5 * (1 - s / 24)) * (0.6 + bass * 0.4)})`
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R)
      ctx.stroke()
    }
    for (let i = 0; i < n; i++) {
      const bearing = ((i * 2.399963) % TAU) // golden angle: contacts spread evenly around
      const age = (((sweep - bearing) % TAU) + TAU) % TAU / TAU // 0 right after the beam passed
      const glow = Math.pow(1 - age, 3)
      const v = levels[i]
      if (v < 0.04) continue
      const r = R * (0.12 + (1 - v) * 0.85) // loud contacts close in on the centre
      const x = cx + Math.cos(bearing) * r
      const y = cy + Math.sin(bearing) * r
      ctx.fillStyle = glow > 0.8 ? soft : `rgba(${rgb}, ${0.15 + glow * 0.85})`
      ctx.beginPath()
      ctx.arc(x, y, Math.max(0.5, 1.5 + v * 4 * (0.4 + glow)), 0, TAU)
      ctx.fill()
    }
  },
})
