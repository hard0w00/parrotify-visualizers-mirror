// Fractal Tree: a glowing tree; the bass makes the trunk grow, the mids spread the branches,
// the highs make the outer twigs sway and blossom.
piratify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, time, bass, mid, high } = f
    const depth = 9
    const spread = 0.35 + mid * 0.5
    const len0 = h * (0.2 + bass * 0.08)
    ctx.lineCap = 'round'
    const branch = (x, y, a, len, d) => {
      const sway = Math.sin(time * 1.5 + d * 0.7) * 0.03 * (depth - d) * (0.3 + high)
      const x2 = x + Math.cos(a + sway) * len
      const y2 = y + Math.sin(a + sway) * len
      const v = levels[Math.min(63, d * 7)]
      ctx.strokeStyle = d < depth - 2 ? `rgba(${rgb}, ${0.5 + v * 0.5})` : `rgba(${accentRgb}, ${0.5 + v * 0.5})`
      ctx.lineWidth = Math.max(0.5, (depth - d) * 1.1)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      if (d + 1 >= depth) {
        if (v > 0.3) {
          ctx.fillStyle = `rgba(255, 220, 240, ${v})`
          ctx.fillRect(x2 - 1.5, y2 - 1.5, 3, 3)
        }
        return
      }
      const shrink = 0.72 + v * 0.06
      branch(x2, y2, a - spread, len * shrink, d + 1)
      branch(x2, y2, a + spread, len * shrink, d + 1)
    }
    branch(w / 2, h, -Math.PI / 2, len0, 0)
  },
})
