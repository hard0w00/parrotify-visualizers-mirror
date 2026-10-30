// Pulsar: stacked lines of the spectrum like the famous pulsar plot; every few frames the
// current spectrum enters at the front and the older ones move back and up.
const history = []
let carry = 0
let lastTime = 0

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, time } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    carry += dt * 12
    if (carry >= 1 || !history.length) {
      carry = 0
      history.unshift(Float32Array.from(levels))
      if (history.length > 32) history.pop()
    }
    const lines = history.length
    const left = w * 0.18
    const width = w * 0.64
    const gap = (h * 0.75) / 32
    // back to front: each line first erases what lies below it, so near lines hide far ones
    for (let j = lines - 1; j >= 0; j--) {
      const spec = history[j]
      const base = h * 0.88 - j * gap
      const pts = []
      for (let x = 0; x <= 60; x++) {
        const p = x / 60
        const centre = Math.exp(-Math.pow((p - 0.5) * 3.2, 2)) // peaks only in the middle
        const v = spec[Math.min(spec.length - 1, Math.floor(Math.abs(p - 0.5) * 2 * spec.length))]
        const wiggle = Math.sin(p * 40 + j * 1.7 + time * 0.3) * 0.04
        pts.push([left + p * width, base - (v * 0.9 + wiggle + 0.02) * centre * h * 0.28])
      }
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0, 0, 0, 1)'
      ctx.beginPath()
      ctx.moveTo(pts[0][0], h)
      for (const [x, y] of pts) ctx.lineTo(x, y)
      ctx.lineTo(pts[pts.length - 1][0], h)
      ctx.closePath()
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = j === 0 ? soft : `rgba(${rgb}, ${0.95 - (j / 32) * 0.6})`
      ctx.lineWidth = 1.3
      ctx.beginPath()
      pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.stroke()
    }
  },
})
