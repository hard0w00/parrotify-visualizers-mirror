// Heartbeat: an ECG monitor. Every bass beat draws a heartbeat spike on the trace; the pulse
// number counts the beats per minute of the music.
const trace = []
const beats = []
let pending = []
let lastBass = 0
let lastBeat = -1
let carry = 0
let lastTime = 0

// the shape of one heartbeat (P wave, QRS spike, T wave), sampled
const SHAPE = [0, 0.05, 0.1, 0.05, 0, 0, -0.1, 1, -0.35, 0, 0, 0.05, 0.12, 0.18, 0.12, 0.05, 0]

piratify.register({
  trails: false,
  draw(ctx, f) {
    const { w, h, rgb, soft, time, bass, high } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    if (bass - lastBass > 0.07 && bass > 0.3 && time - lastBeat > 0.3) {
      if (lastBeat > 0) beats.push(time - lastBeat)
      if (beats.length > 8) beats.shift()
      lastBeat = time
      pending = SHAPE.map((s) => s * (0.6 + bass * 0.6))
    }
    lastBass = bass
    carry += dt * 90
    while (carry >= 1) {
      carry -= 1
      const s = pending.length ? pending.shift() : 0
      trace.push(s + (Math.random() - 0.5) * high * 0.04)
      if (trace.length > 450) trace.shift()
    }
    const mid = h * 0.6
    ctx.strokeStyle = `rgba(${rgb}, 0.07)`
    ctx.lineWidth = 1
    for (let x = 0; x < w; x += 24) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y < h; y += 24) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    const step = w / 450
    ctx.strokeStyle = `rgba(${rgb}, 0.95)`
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < trace.length; i++) {
      const x = w - (trace.length - i) * step
      const y = mid - trace[i] * h * 0.45
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    const avg = beats.length ? beats.reduce((a, b) => a + b, 0) / beats.length : 0
    const bpm = avg > 0 ? Math.round(60 / avg) : 0
    const fresh = Math.max(0, 1 - (time - lastBeat) * 3)
    ctx.fillStyle = soft
    ctx.font = `bold ${Math.max(8, Math.round(h * 0.11))}px monospace`
    ctx.fillText(bpm ? String(bpm) : '--', w * 0.04, h * 0.18)
    ctx.globalAlpha = 0.3 + fresh * 0.7
    ctx.font = `${Math.max(6, Math.round(h * 0.09))}px monospace`
    ctx.fillText('♥', w * 0.04 + h * 0.26, h * 0.17)
    ctx.globalAlpha = 1
  },
})
