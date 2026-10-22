// Plasma: a soft plasma field stirred by bass, mids and highs, with a glowing scope on top.
// One of parrotify's original visualizers (moved here from the built-in presets).
parrotify.register({
  trails: true,
  draw(ctx, f) {
    const { levels, w, h, rgb, time: now, bass, mid: midE, high, energy } = f
    const n = levels.length
    const mid = h * 0.5
    const maxUp = Math.max(0, mid - 10)
    const step = Math.max(10, Math.round(Math.min(w, h) / 32)) // about the same cell count at any size
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const nx = x / w
        const ny = y / h
        const v =
          Math.sin(nx * 6 + now * 1.2 + bass * 4) +
          Math.sin(ny * 5 - now * 0.9 + midE * 3) +
          Math.sin((nx + ny) * 4 + now * 0.7 + high * 2)
        const amp = (v + 3) / 6
        const band = levels[Math.floor(nx * (n - 1))] || 0.2
        const hue = (amp * 160 + now * 30 + band * 80) % 360
        ctx.fillStyle = `hsla(${hue}, 85%, ${35 + amp * 25}%, ${0.08 + band * 0.12})`
        ctx.fillRect(x, y, step + 1, step + 1)
      }
    }
    // bright horizontal scope overlay
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * w
      const y = mid + Math.sin(now * 2 + i * 0.2) * levels[i] * maxUp * 0.7
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 + energy * 0.4})`
    ctx.lineWidth = 2
    ctx.shadowColor = `rgba(${rgb}, 0.8)`
    ctx.shadowBlur = 16
    ctx.stroke()
  },
})
