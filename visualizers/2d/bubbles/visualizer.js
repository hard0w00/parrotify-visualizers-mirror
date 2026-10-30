// Bubbles: bubbles rise from the bottom, each born from a band at its place in the spectrum
// (bass left, highs right) and as big as the band is loud. At the top they pop.
const bubbles = []
const pops = []
let lastTime = 0

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, time } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    const n = levels.length
    for (let i = 0; i < n; i += 2) {
      const v = levels[i]
      // the vents along the bottom where the bubbles come from
      ctx.fillStyle = `rgba(${rgb}, ${0.08 + v * 0.4})`
      ctx.fillRect((i / n) * w, h - 2 - v * 6, (2 / n) * w - 1, 2 + v * 6)
      if (v > 0.3 && Math.random() < v * dt * 3 && bubbles.length < 120) {
        bubbles.push({ x: ((i + Math.random() * 2) / n) * w, y: h + 10, r: 2 + v * Math.min(w, h) * 0.04, ph: Math.random() * 6, top: h * Math.random() * 0.3 })
      }
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i]
      b.y -= dt * (30 + 900 / (b.r + 10))
      const x = b.x + Math.sin(time * 2 + b.ph) * b.r * 0.6
      if (b.y < b.top) {
        if (pops.length < 60) pops.push({ x, y: b.y, r: b.r, life: 1 })
        bubbles.splice(i, 1)
        continue
      }
      ctx.strokeStyle = `rgba(${rgb}, 0.7)`
      ctx.fillStyle = `rgba(${rgb}, 0.08)`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, b.y, Math.max(0.5, b.r), 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = soft
      ctx.beginPath()
      ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, Math.max(0.5, b.r * 0.18), 0, Math.PI * 2)
      ctx.fill()
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i]
      p.life -= dt * 4
      if (p.life <= 0) {
        pops.splice(i, 1)
        continue
      }
      const rr = p.r * (1 + (1 - p.life) * 0.8)
      ctx.strokeStyle = `rgba(${rgb}, ${p.life * 0.7})`
      for (let k = 0; k < 8; k++) { // the bubble bursts into short dashes
        const a = (k / 8) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr)
        ctx.lineTo(p.x + Math.cos(a) * rr * 1.3, p.y + Math.sin(a) * rr * 1.3)
        ctx.stroke()
      }
    }
  },
})
