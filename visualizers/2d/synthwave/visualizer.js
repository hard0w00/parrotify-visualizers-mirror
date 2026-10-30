// Synthwave: an 80s sunset. A striped sun sinks behind mountains shaped by the spectrum, a
// neon grid rushes towards you, faster the more energy the music has.
let travel = 0
let lastTime = 0

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, accentRgb, time, bass, energy } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    travel += dt * (0.3 + energy * 2.5)
    const horizon = h * 0.58
    // sun with cut-out stripes in its lower half
    const sr = Math.max(1, Math.min(w, h) * (0.22 + bass * 0.04))
    const sx = w / 2
    const sy = horizon - sr * 0.35
    ctx.fillStyle = `rgba(${accentRgb}, 0.9)`
    ctx.beginPath()
    ctx.arc(sx, sy, sr, Math.PI, 0)
    ctx.lineTo(sx + sr, horizon)
    ctx.lineTo(sx - sr, horizon)
    ctx.closePath()
    ctx.fill()
    ctx.globalCompositeOperation = 'destination-out' // stripes cut into the lower part, wider further down
    ctx.fillStyle = 'rgba(0, 0, 0, 1)'
    const top = sy - sr * 0.45
    for (let k = 1; k < 6; k++) {
      const y0 = top + (k * (horizon - top)) / 6
      ctx.fillRect(sx - sr, y0, sr * 2, 2 + k * 2)
    }
    ctx.globalCompositeOperation = 'source-over'
    // mountains from the spectrum, mirrored around the centre
    ctx.fillStyle = 'rgba(12, 6, 24, 0.95)'
    ctx.strokeStyle = `rgba(${rgb}, 0.9)`
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, horizon)
    const n = 32
    for (let i = 0; i <= n; i++) {
      const p = i / n
      const band = Math.floor(Math.abs(p - 0.5) * 2 * 63)
      const v = levels[band]
      const ridge = 0.25 + 0.75 * Math.abs(p - 0.5) * 2 // low in the middle, so the sun shows
      ctx.lineTo(p * w, horizon - v * h * 0.22 * ridge - ridge * h * 0.04)
    }
    ctx.lineTo(w, horizon)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    // the grid: horizontal lines come closer, vertical lines fan out from the vanishing point
    ctx.strokeStyle = `rgba(${rgb}, 0.6)`
    ctx.lineWidth = 1
    for (let k = 0; k < 14; k++) {
      const z = ((k + (travel % 1)) / 14)
      const y = horizon + Math.pow(z, 2.2) * (h - horizon)
      ctx.globalAlpha = z
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    for (let k = -12; k <= 12; k++) {
      ctx.beginPath()
      ctx.moveTo(w / 2 + k * w * 0.02, horizon)
      ctx.lineTo(w / 2 + k * w * 0.16, h)
      ctx.stroke()
    }
    ctx.fillStyle = soft
    ctx.fillRect(0, horizon - 1, w, 2)
  },
})
