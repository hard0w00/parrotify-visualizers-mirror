// Amplifier: two backlit analogue VU meters of an old hi-fi amp. The left needle follows the
// bass, the right one the highs; needles have a little inertia and a red peak lamp lights on hits.
const needles = [0, 0]
const peaks = [0, 0]
let lastTime = 0

parrotify.register({
  trails: false,
  color: '#ffb347',
  draw(ctx, f) {
    const { w, h, rgb, time, bass, high, mid } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    const targets = [Math.min(1, bass * 1.1), Math.min(1, (high * 0.6 + mid * 0.6))]
    // brushed metal front plate
    ctx.fillStyle = 'rgba(28, 26, 30, 0.95)'
    ctx.fillRect(0, 0, w, h)
    const mw = Math.min(w * 0.42, h * 1.2)
    const mh = mw * 0.62
    const top = (h - mh) / 2
    for (let m = 0; m < 2; m++) {
      // needle: spring towards the target, quick up, slower down
      const k = targets[m] > needles[m] ? 14 : 4
      needles[m] += (targets[m] - needles[m]) * Math.min(1, dt * k)
      peaks[m] = targets[m] > 0.85 ? 1 : Math.max(0, peaks[m] - dt * 2)
      const x0 = m ? w / 2 + (w / 2 - mw) / 2 : (w / 2 - mw) / 2
      // the meter's window, lit warm from behind
      const glow = ctx.createRadialGradient(x0 + mw / 2, top + mh, 0, x0 + mw / 2, top + mh, mw)
      glow.addColorStop(0, `rgba(${rgb}, 1)`)
      glow.addColorStop(1, `rgba(${rgb}, 0.55)`)
      ctx.fillStyle = glow
      ctx.fillRect(x0, top, mw, mh)
      ctx.strokeStyle = 'rgba(10, 10, 10, 1)'
      ctx.lineWidth = 3
      ctx.strokeRect(x0, top, mw, mh)
      // scale arc with ticks; the last fifth is red
      const px = x0 + mw / 2
      const py = top + mh * 0.95
      const r = mh * 0.75
      const a0 = -Math.PI * 0.78
      const a1 = -Math.PI * 0.22
      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgba(20, 15, 10, 0.9)'
      ctx.beginPath()
      ctx.arc(px, py, r, a0, a0 + (a1 - a0) * 0.75)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(200, 20, 20, 0.95)'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(px, py, r, a0 + (a1 - a0) * 0.75, a1)
      ctx.stroke()
      ctx.lineWidth = 1.5
      for (let t = 0; t <= 10; t++) {
        const a = a0 + ((a1 - a0) * t) / 10
        const len = t % 5 === 0 ? r * 0.14 : r * 0.08
        ctx.strokeStyle = t >= 8 ? 'rgba(200, 20, 20, 0.95)' : 'rgba(20, 15, 10, 0.9)'
        ctx.beginPath()
        ctx.moveTo(px + Math.cos(a) * r, py + Math.sin(a) * r)
        ctx.lineTo(px + Math.cos(a) * (r + len), py + Math.sin(a) * (r + len))
        ctx.stroke()
      }
      ctx.fillStyle = 'rgba(20, 15, 10, 0.85)'
      ctx.font = `bold ${Math.max(6, Math.round(mh * 0.11))}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('VU', px, top + mh * 0.62)
      ctx.font = `${Math.max(5, Math.round(mh * 0.07))}px sans-serif`
      ctx.fillText(m ? 'TREBLE' : 'BASS', px, top + mh * 0.75)
      // the needle (with a little jitter like a real one)
      const v = Math.min(1.05, needles[m] + Math.sin(time * 40 + m) * 0.004)
      const a = a0 + (a1 - a0) * v
      ctx.strokeStyle = 'rgba(15, 10, 10, 1)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px + Math.cos(a) * r * 1.12, py + Math.sin(a) * r * 1.12)
      ctx.stroke()
      ctx.fillStyle = 'rgba(15, 10, 10, 1)'
      ctx.fillRect(x0, top + mh * 0.88, mw, mh * 0.12)
      // peak lamp
      ctx.fillStyle = `rgba(255, 40, 30, ${0.15 + peaks[m] * 0.85})`
      ctx.shadowColor = 'rgba(255, 40, 30, 1)'
      ctx.shadowBlur = peaks[m] * 15
      ctx.beginPath()
      ctx.arc(x0 + mw * 0.9, top + mh * 0.15, Math.max(1, mh * 0.035), 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }
    ctx.textAlign = 'start'
  },
})
