// Clockwork: five meshed brass gears. The music drives them: the big wheel turns with the
// energy, the others follow at their gear ratio, the teeth stretch with their band.
let turn = 0
let lastTime = 0

const GEARS = [
  // x, y in units of the short side; teeth count; band
  { x: 0, y: 0, teeth: 24, band: 2 },
  { x: 0.36, y: -0.12, teeth: 14, band: 14 },
  { x: -0.35, y: 0.14, teeth: 16, band: 28 },
  { x: 0.52, y: 0.22, teeth: 10, band: 42 },
  { x: -0.58, y: -0.2, teeth: 12, band: 56 },
]

piratify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, accentRgb, time, energy } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    turn += dt * (0.15 + energy * 1.6)
    const unit = Math.min(w, h)
    const toothSize = unit * 0.012
    GEARS.forEach((g, i) => {
      const v = levels[g.band]
      const r = Math.max(1, (g.teeth * toothSize) / 1.1)
      const cx = w / 2 + g.x * unit * 1.1
      const cy = h / 2 + g.y * unit * 1.1
      const dir = i === 0 ? 1 : -1 // every gear meshes with the big one
      const a0 = (dir * turn * GEARS[0].teeth) / g.teeth + (i ? Math.PI / g.teeth : 0)
      ctx.fillStyle = `rgba(${i % 2 ? accentRgb : rgb}, ${0.25 + v * 0.5})`
      ctx.strokeStyle = soft
      ctx.lineWidth = 1
      ctx.beginPath()
      const steps = g.teeth * 4
      for (let s = 0; s <= steps; s++) {
        const a = a0 + (s / steps) * Math.PI * 2
        const tooth = s % 4 === 1 || s % 4 === 2
        const rr = tooth ? r + toothSize * (1.2 + v * 1.8) : r
        const x = cx + Math.cos(a) * rr
        const y = cy + Math.sin(a) * rr
        if (s === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.strokeStyle = `rgba(${rgb}, 0.6)`
      for (let k = 0; k < 4; k++) { // spokes
        const a = a0 + (k * Math.PI) / 2
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(a) * r * 0.75, cy + Math.sin(a) * r * 0.75)
        ctx.stroke()
      }
      ctx.fillStyle = soft
      ctx.beginPath()
      ctx.arc(cx, cy, Math.max(0.5, r * 0.12), 0, Math.PI * 2)
      ctx.fill()
    })
  },
})
