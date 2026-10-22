// Bloom: a flower with three rings of petals. Outer petals open with the bass, the middle ring
// with the mids, the inner one with the highs; the whole blossom turns slowly.
parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, accentRgb, time } = f
    const cx = w / 2
    const cy = h / 2
    const R = Math.max(1, Math.min(w, h) * 0.46)
    const rings = [
      { count: 12, from: 0, len: 1, width: 0.32, col: rgb, spin: 0.1 },
      { count: 9, from: 20, len: 0.68, width: 0.38, col: accentRgb, spin: -0.16 },
      { count: 7, from: 42, len: 0.4, width: 0.45, col: rgb, spin: 0.24 },
    ]
    for (const ring of rings) {
      for (let p = 0; p < ring.count; p++) {
        const v = levels[Math.min(levels.length - 1, ring.from + p * 2)]
        const a = time * ring.spin + (p / ring.count) * Math.PI * 2
        const len = R * ring.len * (0.35 + v * 0.65)
        const half = ((Math.PI * 2) / ring.count) * ring.width
        const tipX = cx + Math.cos(a) * len
        const tipY = cy + Math.sin(a) * len
        ctx.fillStyle = `rgba(${ring.col}, ${0.2 + v * 0.55})`
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.quadraticCurveTo(cx + Math.cos(a - half) * len * 0.75, cy + Math.sin(a - half) * len * 0.75, tipX, tipY)
        ctx.quadraticCurveTo(cx + Math.cos(a + half) * len * 0.75, cy + Math.sin(a + half) * len * 0.75, cx, cy)
        ctx.fill()
      }
    }
    ctx.fillStyle = soft
    ctx.beginPath()
    ctx.arc(cx, cy, Math.max(0.5, R * (0.06 + f.bass * 0.05)), 0, Math.PI * 2)
    ctx.fill()
  },
})
