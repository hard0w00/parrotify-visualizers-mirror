// Lasers: a club laser show. Beams fan out from the stage and sweep with the beat through the
// haze; louder bands make brighter beams, a strong bass flashes the whole fan.
piratify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, time, bass, mid } = f
    // haze
    const haze = ctx.createRadialGradient(w / 2, h, 0, w / 2, h, Math.max(w, h))
    haze.addColorStop(0, `rgba(${rgb}, ${0.12 + bass * 0.2})`)
    haze.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = haze
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'
    const sources = [[w * 0.2, h], [w * 0.5, h], [w * 0.8, h]]
    const beams = 12
    sources.forEach(([sx, sy], s) => {
      const sweep = Math.sin(time * (0.6 + s * 0.2) + s * 2) * 0.6 + (mid - 0.3) * 0.5
      for (let k = 0; k < beams; k++) {
        const v = levels[(s * 20 + k * 3) % 64]
        if (v < 0.12) continue
        const a = -Math.PI / 2 + ((k / (beams - 1)) - 0.5) * 1.6 + sweep
        const len = Math.max(w, h) * 1.4
        const ex = sx + Math.cos(a) * len
        const ey = sy + Math.sin(a) * len
        const col = (k + s) % 2 ? rgb : accentRgb
        const g = ctx.createLinearGradient(sx, sy, ex, ey)
        g.addColorStop(0, `rgba(${col}, ${0.3 + v * 0.7})`)
        g.addColorStop(1, `rgba(${col}, 0)`)
        ctx.strokeStyle = g
        ctx.lineWidth = 1 + v * 3 + bass * 2
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(ex, ey)
        ctx.stroke()
      }
      // the laser head itself
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + bass * 0.5})`
      ctx.beginPath()
      ctx.arc(sx, sy - 2, 3 + bass * 4, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalCompositeOperation = 'source-over'
  },
})
