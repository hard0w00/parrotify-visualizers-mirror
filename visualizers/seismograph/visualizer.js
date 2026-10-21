// Seismograph: a pen scratches the bass and the highs onto paper rolling to the left; strong
// beats shake the needle, the grid marks the seconds.
const samples = []
let carry = 0
let lastTime = 0

piratify.register({
  trails: false,
  draw(ctx, f) {
    const { w, h, rgb, soft, accentRgb, time, bass, high, energy } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    carry += dt * 60
    while (carry >= 1) { // 60 samples a second, independent of the frame rate
      carry -= 1
      const jitter = (Math.random() - 0.5) * (bass * bass * 1.6 + high * 0.3)
      samples.push({ v: jitter, e: energy })
      if (samples.length > 600) samples.shift()
    }
    const step = Math.max(0.5, w / 600)
    const mid = h / 2
    ctx.strokeStyle = `rgba(${rgb}, 0.08)`
    ctx.lineWidth = 1
    const shift = ((time * 60) % 60) * step
    for (let x = w - shift; x > 0; x -= 60 * step) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = mid % 40; y < h; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    ctx.strokeStyle = `rgba(${rgb}, 0.9)`
    ctx.lineWidth = 1.4
    ctx.beginPath()
    for (let i = 0; i < samples.length; i++) {
      const x = w - (samples.length - i) * step
      const y = mid + samples[i].v * h * 0.45
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    // energy as a second, calmer trace below
    ctx.strokeStyle = `rgba(${accentRgb}, 0.5)`
    ctx.beginPath()
    for (let i = 0; i < samples.length; i++) {
      const x = w - (samples.length - i) * step
      const y = h * 0.92 - samples[i].e * h * 0.25
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    const last = samples.length ? samples[samples.length - 1].v : 0
    ctx.fillStyle = soft
    ctx.beginPath()
    ctx.arc(w - 2, mid + last * h * 0.45, 3, 0, Math.PI * 2)
    ctx.fill()
  },
})
