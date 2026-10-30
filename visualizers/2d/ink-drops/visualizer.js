// Ink drops: every beat lets a drop of ink fall into water; it spreads in ragged rings and
// slowly dissolves. Quiet passages leave a still surface.
const drops = []
let lastBass = 0
let lastTime = 0

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { w, h, rgb, soft, accentRgb, time, bass, mid } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    if (bass - lastBass > 0.06 && bass > 0.25 && drops.length < 40) {
      drops.push({ x: Math.random() * w, y: Math.random() * h, r: 2, life: 1, seed: Math.random() * 100, big: bass, tint: Math.random() < 0.3 })
    }
    if (mid > 0.35 && Math.random() < mid * 0.08 && drops.length < 40) {
      drops.push({ x: Math.random() * w, y: Math.random() * h, r: 1, life: 0.7, seed: Math.random() * 100, big: mid * 0.5, tint: false })
    }
    lastBass = bass
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]
      d.r += dt * (30 + d.big * 120) * d.life
      d.life -= dt * 0.25
      if (d.life <= 0) {
        drops.splice(i, 1)
        continue
      }
      const col = d.tint ? accentRgb : rgb
      // three soft, wobbling rings per drop
      for (let ring = 0; ring < 3; ring++) {
        const rr = Math.max(0.5, d.r * (1 - ring * 0.25))
        ctx.fillStyle = `rgba(${col}, ${d.life * (0.08 + ring * 0.05)})`
        ctx.beginPath()
        for (let k = 0; k <= 32; k++) {
          const a = (k / 32) * Math.PI * 2
          const wob = 1 + 0.12 * Math.sin(a * 5 + d.seed + ring) + 0.06 * Math.sin(a * 11 - d.seed + time)
          const x = d.x + Math.cos(a) * rr * wob
          const y = d.y + Math.sin(a) * rr * wob
          if (k === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.fill()
      }
      ctx.fillStyle = soft
      ctx.globalAlpha = Math.max(0, d.life - 0.6)
      ctx.beginPath()
      ctx.arc(d.x, d.y, Math.max(0.5, 3 * d.life), 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
  },
})
