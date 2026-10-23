// Vinyl: a record spins on the turntable. Its grooves light up with the bands (bass at the
// edge, highs near the label), the tone arm rides along and a sheen turns with the disc.
let spin = 0
let lastTime = 0

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, accentRgb, time, playing, bass } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    spin += dt * (playing ? (33.3 / 60) * Math.PI * 2 : 0)
    const R = Math.max(2, Math.min(w, h) * 0.44)
    const cx = w / 2 - R * 0.15
    const cy = h / 2
    ctx.fillStyle = 'rgba(10, 10, 14, 0.85)'
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.fill()
    const grooves = 32
    for (let g = 0; g < grooves; g++) {
      const v = levels[Math.floor(((grooves - 1 - g) / grooves) * levels.length)]
      const r = R * (0.36 + (g / grooves) * 0.62)
      ctx.strokeStyle = `rgba(${rgb}, ${0.05 + v * 0.5})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx, cy, Math.max(0.5, r), 0, Math.PI * 2)
      ctx.stroke()
    }
    for (let k = 0; k < 2; k++) { // sheen, turning with the record
      const a = spin + k * Math.PI
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
      ctx.lineWidth = R * 0.25
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.68, a - 0.25, a + 0.25)
      ctx.stroke()
    }
    ctx.fillStyle = `rgba(${accentRgb}, 0.85)`
    ctx.beginPath()
    ctx.arc(cx, cy, R * 0.32, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = soft
    ctx.lineWidth = 2
    ctx.beginPath() // a mark on the label shows the rotation
    ctx.moveTo(cx + Math.cos(spin) * R * 0.1, cy + Math.sin(spin) * R * 0.1)
    ctx.lineTo(cx + Math.cos(spin) * R * 0.28, cy + Math.sin(spin) * R * 0.28)
    ctx.stroke()
    ctx.fillStyle = 'rgba(10, 10, 14, 1)'
    ctx.beginPath()
    ctx.arc(cx, cy, Math.max(0.5, R * 0.03), 0, Math.PI * 2)
    ctx.fill()
    // tone arm: pivot top right, the needle sits in the grooves and shakes with the bass
    const px = cx + R * 1.15
    const py = cy - R * 0.85
    const nx = cx + R * 0.55 + (Math.random() - 0.5) * bass * 2
    const ny = cy + R * 0.2
    ctx.strokeStyle = soft
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(nx, ny)
    ctx.stroke()
    ctx.fillStyle = soft
    ctx.beginPath()
    ctx.arc(px, py, Math.max(0.5, R * 0.06), 0, Math.PI * 2)
    ctx.fill()
  },
})
