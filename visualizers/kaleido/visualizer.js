// Kaleido: The spectrum as one jagged petal, mirrored eight times around the centre.
// One of parrotify's original visualizers (moved here from the built-in presets).
parrotify.register({
  trails: false,
  draw(ctx, f) {
    const mode = 'kaleido'
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
    // the spectrum as one jagged petal, mirrored eight times around the centre
    const cx = w / 2
    const cy = h / 2
    const r0 = Math.min(w, h) * 0.04
    const r1 = Math.min(w, h) * 0.48
    const slices = 8
    const steps = 24
    const spin = now * 0.15 + bass * 0.4
    for (let sIdx = 0; sIdx < slices; sIdx++) {
      for (const flip of [1, -1]) {
        ctx.beginPath()
        for (let k = 0; k <= steps; k++) {
          const amp = levels[Math.floor((k / steps) * (n - 1))]
          const a = spin + (sIdx * 2 * Math.PI) / slices + (flip * (k / steps) * Math.PI) / slices
          const r = r0 + (r1 - r0) * (0.4 + amp * 0.6) * (k / steps)
          const x = cx + Math.cos(a) * r
          const y = cy + Math.sin(a) * r
          if (k === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(${rgb}, ${0.25 + energy * 0.6})`
        ctx.lineWidth = 1.2 + midE * 2
        ctx.stroke()
      }
    }
    ctx.fillStyle = soft
    ctx.globalAlpha = 0.2 + bass * 0.5
    ctx.beginPath()
    ctx.arc(cx, cy, r0 * (0.5 + bass * 0.8), 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  },
})
