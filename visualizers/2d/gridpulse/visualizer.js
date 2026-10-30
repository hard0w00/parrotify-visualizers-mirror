// Grid Pulse: a grid of cells that swell and glow in a diagonal wave across the spectrum.
// One of parrotify's original visualizers (moved here from the built-in presets).
parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, time: now } = f
    const n = levels.length
    const cols = 16
    const rows = 10
    const cw = w / cols
    const rh = h / rows
    ctx.lineWidth = 1
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const amp = levels[Math.floor(((c + r) / (cols + rows)) * (n - 1)) % n]
        const pulse = 0.3 + amp * 0.7 + Math.sin(now * 3 + c * 0.4 + r * 0.3) * 0.15 * amp
        const inset = (1 - pulse) * Math.min(cw, rh) * 0.35
        const hue = (c * 12 + r * 8 + now * 25) % 360
        ctx.fillStyle = `hsla(${hue}, 85%, ${40 + amp * 30}%, ${0.08 + amp * 0.35})`
        ctx.fillRect(c * cw + inset, r * rh + inset, Math.max(0, cw - inset * 2), Math.max(0, rh - inset * 2))
        ctx.strokeStyle = `rgba(${rgb}, ${0.05 + amp * 0.2})`
        ctx.strokeRect(c * cw, r * rh, cw, rh)
      }
    }
  },
})
