// Jellyfish: a glowing jellyfish drifts through deep water. The bell contracts on the bass and
// pushes it upwards, its tentacles wave with the mids and highs, plankton sparkles around it.
let y = 0.5
let vy = 0
let lastBass = 0
let lastTime = 0

parrotify.register({
  trails: true,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, accentRgb, time, bass, high } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    if (bass - lastBass > 0.05 && bass > 0.3) vy -= 0.08 + bass * 0.1
    lastBass = bass
    vy += dt * 0.05 // sinks slowly
    vy *= 0.97
    y += vy * dt
    if (y < 0.3) { y = 0.3; vy = Math.abs(vy) * 0.3 }
    if (y > 0.6) { y = 0.6; vy = 0 }
    const cx = w / 2 + Math.sin(time * 0.2) * w * 0.15
    const cy = h * y
    const size = Math.max(1, Math.min(w, h) * 0.22)
    const squeeze = 1 - bass * 0.3
    const bw = size * (1.1 - squeeze * 0.2)
    const bh = size * 0.8 * squeeze
    ctx.fillStyle = `rgba(${rgb}, 0.35)`
    ctx.beginPath()
    ctx.ellipse(cx, cy, Math.max(0.5, bw), Math.max(0.5, bh), 0, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = soft
    ctx.lineWidth = 1.5
    ctx.stroke()
    const count = 9
    for (let t = 0; t < count; t++) {
      const x0 = cx - bw * 0.85 + (t / (count - 1)) * bw * 1.7
      const v = levels[8 + t * 6]
      const len = size * (1.2 + v * 1.6)
      ctx.strokeStyle = `rgba(${t % 3 === 1 ? accentRgb : rgb}, ${0.25 + v * 0.6})`
      ctx.lineWidth = 1 + v * 1.5
      ctx.beginPath()
      ctx.moveTo(x0, cy)
      for (let s = 1; s <= 14; s++) {
        const p = s / 14
        const x = x0 + Math.sin(time * 2.4 + t * 0.9 + p * 6) * size * 0.18 * p * (0.6 + v)
        ctx.lineTo(x, cy + p * len)
      }
      ctx.stroke()
    }
    // plankton
    ctx.fillStyle = soft
    for (let p = 0; p < 30; p++) {
      const px = ((p * 97.3 + time * (4 + (p % 5))) % (w + 20)) - 10
      const py = (p * 53.7 + Math.sin(time * 0.5 + p) * 20) % Math.max(1, h)
      ctx.globalAlpha = high * 0.8 * ((p % 4) / 4 + 0.25)
      ctx.fillRect(px, py, 1.5, 1.5)
    }
    ctx.globalAlpha = 1
  },
})
