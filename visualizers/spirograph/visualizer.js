// Spirograph: a pen on a gear rolling inside a ring draws endless loops. The mids change the
// gear, the highs move the pen; the oldest part of the line fades out behind it.
const points = []
let t = 0
let sMid = 0.3
let sHigh = 0.3
let lastTime = 0

piratify.register({
  trails: false,
  draw(ctx, f) {
    const { w, h, rgb, soft, time, mid, high, bass } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    sMid += (mid - sMid) * 0.01 // slow changes, so the line bends instead of jumping
    sHigh += (high - sHigh) * 0.01
    if (!points.length) { // start with a figure already drawn
      for (let k = 0; k < 900; k++) points.push([(k / 900) * 25, sMid, sHigh])
      t = 25
    }
    const steps = 12
    for (let s = 0; s < steps; s++) {
      t += (dt * (3 + bass * 8)) / steps
      points.push([t, sMid, sHigh])
      if (points.length > 1400) points.shift()
    }
    const cx = w / 2
    const cy = h / 2
    const R = Math.max(1, Math.min(w, h) * 0.3)
    // points are stored as parameters, so the figure follows a resize
    const at = ([tt, m, hi]) => {
      const r = R * (0.27 + m * 0.35) // gear size
      const d = r * (0.6 + hi * 1.2) // pen distance from the gear's centre
      return [cx + (R - r) * Math.cos(tt) + d * Math.cos(((R - r) / r) * tt), cy + (R - r) * Math.sin(tt) - d * Math.sin(((R - r) / r) * tt)]
    }
    const chunk = 100
    for (let c = 0; c < points.length - 1; c += chunk) {
      const age = 1 - c / Math.max(1, points.length)
      ctx.strokeStyle = `rgba(${rgb}, ${(1 - age) * 0.85 + 0.05})`
      ctx.lineWidth = 1 + (1 - age) * bass * 2
      ctx.beginPath()
      const [x0, y0] = at(points[c])
      ctx.moveTo(x0, y0)
      for (let k = c + 1; k <= Math.min(points.length - 1, c + chunk); k++) {
        const [x, y] = at(points[k])
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    if (points.length) {
      const [x, y] = at(points[points.length - 1])
      ctx.fillStyle = soft
      ctx.beginPath()
      ctx.arc(x, y, 2.5 + bass * 3, 0, Math.PI * 2)
      ctx.fill()
    }
  },
})
