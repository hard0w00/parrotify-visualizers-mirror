// Mandala: rings of petals, dots and spikes unfolding in rotational symmetry. Every ring listens
// to its own band and turns the other way than its neighbours.
piratify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, soft, time, bass } = f
    const cx = w / 2
    const cy = h / 2
    const R = Math.min(w, h) * 0.46
    ctx.save()
    ctx.translate(cx, cy)
    const rings = 6
    for (let r = rings - 1; r >= 0; r--) {
      const v = levels[r * 10 + 2]
      const count = 6 + r * 4
      const rad = R * (0.15 + (r / rings) * 0.85)
      const spin = time * 0.15 * (r % 2 ? -1 : 1) + v * 0.3
      const col = r % 2 ? rgb : accentRgb
      for (let k = 0; k < count; k++) {
        const a = spin + (k / count) * Math.PI * 2
        ctx.save()
        ctx.rotate(a)
        if (r % 3 === 0) {
          // petal
          const len = rad * (0.35 + v * 0.35)
          ctx.fillStyle = `rgba(${col}, ${0.2 + v * 0.5})`
          ctx.strokeStyle = `rgba(${col}, ${0.6 + v * 0.4})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(rad - len, 0)
          ctx.quadraticCurveTo(rad - len / 2, len * 0.35, rad, 0)
          ctx.quadraticCurveTo(rad - len / 2, -len * 0.35, rad - len, 0)
          ctx.fill()
          ctx.stroke()
        } else if (r % 3 === 1) {
          // dot
          ctx.fillStyle = `rgba(${col}, ${0.5 + v * 0.5})`
          ctx.beginPath()
          ctx.arc(rad, 0, Math.max(0.5, R * (0.012 + v * 0.025)), 0, Math.PI * 2)
          ctx.fill()
        } else {
          // spike
          ctx.strokeStyle = `rgba(${col}, ${0.4 + v * 0.6})`
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(rad * 0.85, 0)
          ctx.lineTo(rad * (1 + v * 0.15), 0)
          ctx.stroke()
        }
        ctx.restore()
      }
      ctx.strokeStyle = `rgba(${col}, ${0.15 + v * 0.2})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(0, 0, rad, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.fillStyle = soft
    ctx.beginPath()
    ctx.arc(0, 0, R * (0.06 + bass * 0.05), 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  },
})
