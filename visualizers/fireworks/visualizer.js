// Fireworks: beats launch rockets, which burst into sparks that fall and fade. Big beats make
// big bursts, the highs make them sparkle.
const rockets = []
const sparks = []
let lastBass = 0
let lastTime = 0

piratify.register({
  trails: true,
  draw(ctx, f) {
    const { w, h, rgb, soft, accentRgb, time, bass, high } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    if (bass - lastBass > 0.06 && bass > 0.3 && rockets.length < 6) {
      rockets.push({ x: w * (0.15 + Math.random() * 0.7), y: h, vy: -h * (0.9 + Math.random() * 0.4), power: bass, col: Math.random() < 0.4 ? accentRgb : rgb })
    }
    lastBass = bass
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i]
      r.y += r.vy * dt
      r.vy += h * 0.9 * dt
      ctx.fillStyle = soft
      ctx.fillRect(r.x - 1, r.y - 1, 2, 4)
      if (r.vy >= -h * 0.1) { // at the top: burst
        const count = Math.round(30 + r.power * 70)
        for (let k = 0; k < count && sparks.length < 700; k++) {
          const a = (k / count) * Math.PI * 2 + Math.random() * 0.2
          const sp = h * (0.15 + Math.random() * 0.35) * (0.5 + r.power)
          sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, col: r.col })
        }
        rockets.splice(i, 1)
      }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.vx *= 0.985
      s.vy = s.vy * 0.985 + h * 0.25 * dt
      s.life -= dt * 0.7
      if (s.life <= 0) {
        sparks.splice(i, 1)
        continue
      }
      const twinkle = high > 0.3 && Math.random() < high * 0.3 ? 1 : s.life
      ctx.fillStyle = `rgba(${s.col}, ${twinkle})`
      ctx.fillRect(s.x, s.y, 2, 2)
    }
  },
})
