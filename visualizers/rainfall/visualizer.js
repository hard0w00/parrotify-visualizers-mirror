// Rainfall: rain over a dark pond. The louder the music, the heavier the rain; each drop
// leaves a ring on the water, and the bass sends a gust that slants it.
const drops = []
const rings = []
let lastTime = 0

piratify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, time, bass, energy } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    const water = h * 0.78
    const wind = Math.sin(time * 0.3) * 0.15 + bass * 0.5
    const spawn = (energy * 260 + 6) * dt
    for (let s = 0; s < spawn && drops.length < 400; s++) {
      const band = Math.floor(Math.random() * levels.length)
      drops.push({ x: Math.random() * (w * 1.3) - w * 0.15, y: -10, v: h * (1.1 + Math.random() * 0.6), l: 6 + levels[band] * 18 })
    }
    ctx.strokeStyle = `rgba(${rgb}, 0.55)`
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]
      d.y += d.v * dt
      d.x += d.v * dt * wind
      if (d.y >= water + Math.random() * (h - water)) {
        if (rings.length < 160) rings.push({ x: d.x, y: d.y, r: 1, life: 1 })
        drops.splice(i, 1)
        continue
      }
      ctx.moveTo(d.x, d.y)
      ctx.lineTo(d.x - d.l * wind, d.y - d.l)
    }
    ctx.stroke()
    ctx.fillStyle = `rgba(${rgb}, 0.06)`
    ctx.fillRect(0, water, w, h - water)
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i]
      r.r += dt * 26
      r.life -= dt * 1.4
      if (r.life <= 0) {
        rings.splice(i, 1)
        continue
      }
      ctx.strokeStyle = r.life > 0.8 ? soft : `rgba(${rgb}, ${r.life * 0.6})`
      ctx.beginPath()
      ctx.ellipse(r.x, r.y, Math.max(0.5, r.r), Math.max(0.5, r.r * 0.3), 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  },
})
