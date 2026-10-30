// DNA helix: a slowly turning double helix; every rung is a band and lights up with it,
// the strands twist faster with the bass.
let phase = 0
let lastTime = 0

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, accentRgb, time, bass } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    phase += dt * (0.8 + bass * 3)
    const rungs = 40
    const mid = h / 2
    const amp = h * (0.28 + bass * 0.08)
    for (let k = 0; k < rungs; k++) {
      const x = ((k + 0.5) / rungs) * w
      const a = phase + k * 0.38
      const y1 = mid + Math.sin(a) * amp
      const y2 = mid - Math.sin(a) * amp
      const depth = Math.cos(a) // >0: strand 1 in front
      const v = levels[Math.floor((k / rungs) * levels.length)]
      ctx.strokeStyle = `rgba(${k % 2 ? rgb : accentRgb}, ${0.1 + v * 0.8})`
      ctx.lineWidth = 1 + v * 3
      ctx.beginPath()
      ctx.moveTo(x, y1)
      ctx.lineTo(x, y2)
      ctx.stroke()
      const r = Math.max(0.5, (w / rungs) * 0.22)
      ctx.fillStyle = depth > 0 ? soft : `rgba(${rgb}, 0.45)`
      ctx.beginPath()
      ctx.arc(x, y1, r * (1 + depth * 0.4), 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = depth > 0 ? `rgba(${rgb}, 0.45)` : soft
      ctx.beginPath()
      ctx.arc(x, y2, r * (1 - depth * 0.4), 0, Math.PI * 2)
      ctx.fill()
    }
  },
})
