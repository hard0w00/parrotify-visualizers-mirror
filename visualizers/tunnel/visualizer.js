// Tunnel: Rings rushing towards you through a pulsing tunnel.
// One of piratify's original visualizers (moved here from the built-in presets).
piratify.register({
  trails: true,
  draw(ctx, f) {
    const mode = 'tunnel'
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
    // Hypnotic spectrum tunnel (MilkDrop / WMP Ambiance vibe)
    const cx = w / 2
    const cy = h / 2
    const layers = 14
    for (let i = layers; i >= 0; i--) {
      const t0 = (i / layers + now * 0.15) % 1
      const amp = levels[Math.floor((1 - t0) * (n - 1))] || 0.15
      const scale = 0.08 + t0 * 0.95
      const rw = w * scale * (0.55 + amp * 0.25)
      const rh = h * scale * (0.45 + amp * 0.2)
      const hue = (now * 50 + i * 18 + bass * 40) % 360
      ctx.beginPath()
      ctx.ellipse(cx, cy, rw * 0.5, rh * 0.5, now * 0.3 + i * 0.1, 0, Math.PI * 2)
      ctx.strokeStyle = `hsla(${hue}, 85%, ${45 + amp * 30}%, ${0.12 + (1 - t0) * 0.35})`
      ctx.lineWidth = 1.5 + amp * 3
      ctx.stroke()
    }
    // crosshair pulse
    ctx.strokeStyle = `rgba(${rgb}, ${0.15 + bass * 0.4})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx - 20 - bass * 40, cy)
    ctx.lineTo(cx + 20 + bass * 40, cy)
    ctx.moveTo(cx, cy - 20 - bass * 40)
    ctx.lineTo(cx, cy + 20 + bass * 40)
    ctx.stroke()
  },
})
