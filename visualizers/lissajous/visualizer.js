// Lissajous: Oscilloscope figure: mids and highs set the ratio, the bass its size.
// One of piratify's original visualizers (moved here from the built-in presets).
piratify.register({
  trails: true,
  draw(ctx, f) {
    const mode = 'lissajous'
    const { levels, w, h, rgb, soft } = f
    const n = levels.length
    const pad = 10
    const mid = h * 0.5
    const maxUp = mid - pad
    const maxDown = h - mid - pad
    const now = f.time
    const bass = f.bass
    const midE = f.mid
    const high = f.high
    const energy = f.energy
    const ampSafe = (i) => levels[i % n] || 0.1
    // oscilloscope figure: mids and highs set the frequency ratio, the bass its size
    const cx = w / 2
    const cy = h / 2
    const rx = (w / 2 - pad) * (0.35 + bass * 0.6)
    const ry = (h / 2 - pad) * (0.35 + bass * 0.6)
    const a = 2 + Math.round(midE * 3)
    const b = a + 1 + Math.round(high * 3) // never equal to a: equal ratios collapse into a line
    const phase = now * 0.7
    ctx.beginPath()
    for (let k = 0; k <= 360; k++) {
      const tt = (k / 360) * Math.PI * 2
      const x = cx + Math.sin(a * tt + phase) * rx
      const y = cy + Math.sin(b * tt) * ry
      if (k === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = `rgba(${rgb}, ${0.45 + energy * 0.5})`
    ctx.lineWidth = 1.5 + energy * 2.5
    ctx.shadowColor = soft
    ctx.shadowBlur = 8 + energy * 18
    ctx.stroke()
    ctx.shadowBlur = 0
  },
})
