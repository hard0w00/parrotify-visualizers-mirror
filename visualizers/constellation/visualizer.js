// Constellation: a slowly turning sky of stars, each one a band. Stars that shine together
// are joined by lines, so the music draws its own star signs.
function rnd(i) {
  const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453
  return x - Math.floor(x)
}
const STARS = Array.from({ length: 48 }, (_, i) => ({ a: rnd(i) * Math.PI * 2, d: 0.15 + Math.sqrt(rnd(i + 100)) * 0.85, band: Math.floor(rnd(i + 200) * 64) }))

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, accentRgb, time } = f
    const cx = w / 2
    const cy = h / 2
    const R = Math.max(w, h) * 0.6
    const pos = STARS.map((s) => {
      const a = s.a + time * 0.02
      return { x: cx + Math.cos(a) * s.d * R, y: cy + Math.sin(a) * s.d * R * 0.75, v: levels[s.band] }
    })
    ctx.lineWidth = 1
    for (let i = 0; i < pos.length; i++) {
      if (pos[i].v < 0.35) continue
      for (let j = i + 1; j < pos.length; j++) {
        if (pos[j].v < 0.35) continue
        const dx = pos[i].x - pos[j].x
        const dy = pos[i].y - pos[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > R * 0.35) continue
        ctx.strokeStyle = `rgba(${accentRgb}, ${Math.min(pos[i].v, pos[j].v) * (1 - dist / (R * 0.35)) * 0.8})`
        ctx.beginPath()
        ctx.moveTo(pos[i].x, pos[i].y)
        ctx.lineTo(pos[j].x, pos[j].y)
        ctx.stroke()
      }
    }
    for (const p of pos) {
      const twinkle = 0.7 + 0.3 * Math.sin(time * 3 + p.x)
      ctx.fillStyle = p.v > 0.6 ? soft : `rgba(${rgb}, ${(0.3 + p.v * 0.7) * twinkle})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(0.5, 1 + p.v * 3.5), 0, Math.PI * 2)
      ctx.fill()
      if (p.v > 0.5) { // a cross-shaped glint on the bright ones
        const l = p.v * 9
        ctx.strokeStyle = `rgba(${rgb}, ${p.v * 0.5})`
        ctx.beginPath()
        ctx.moveTo(p.x - l, p.y)
        ctx.lineTo(p.x + l, p.y)
        ctx.moveTo(p.x, p.y - l)
        ctx.lineTo(p.x, p.y + l)
        ctx.stroke()
      }
    }
  },
})
