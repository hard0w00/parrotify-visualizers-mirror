// Scope: an oscilloscope trace of the spectrum with a phase-shifted second wave
// (the wave layer of WMP's "Bars and Waves"). One of piratify's original visualizers.
piratify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, time: now } = f
    const n = levels.length
    const mid = h * 0.5
    const maxUp = Math.max(0, mid - 10)
    const maxDown = Math.max(0, h - mid - 10)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
    ctx.fillRect(0, 0, w, h)
    // grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
    ctx.lineWidth = 1
    for (let g = 1; g < 4; g++) {
      ctx.beginPath()
      ctx.moveTo(0, (h * g) / 4)
      ctx.lineTo(w, (h * g) / 4)
      ctx.stroke()
    }
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * w
      const y = mid - (levels[i] - 0.15) * maxUp * 1.4
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = `rgba(${rgb}, 0.95)`
    ctx.lineWidth = 2.5
    ctx.shadowColor = soft
    ctx.shadowBlur = 12
    ctx.stroke()
    // secondary phase-shifted wave
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * w
      const y = mid + (levels[(i + 8) % n] - 0.15) * maxDown * 1.1
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = `hsla(${(now * 40) % 360}, 90%, 60%, 0.55)`
    ctx.lineWidth = 1.5
    ctx.shadowBlur = 8
    ctx.stroke()
  },
})
