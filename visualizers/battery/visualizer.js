// Battery: a wall of energy cells lighting up column by column, green at the bottom to red
// at the top. One of piratify's original visualizers (moved here from the built-in presets).
piratify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, time: now } = f
    const n = levels.length
    const pad = 10
    const rows = 12
    const cols = 16
    const cellW = Math.max(2, (w - pad * 2) / cols)
    const cellH = Math.max(2, (h - pad * 2) / rows)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const amp = levels[Math.floor((c / cols) * (n - 1))]
        const lit = amp > ((rows - r) / rows) * 0.85
        if (!lit && amp < 0.08) continue
        const hue = 120 - (r / rows) * 100 + now * 15
        const a = lit ? 0.35 + amp * 0.55 : 0.06 + amp * 0.1
        ctx.fillStyle = `hsla(${hue}, 90%, ${45 + amp * 25}%, ${a})`
        ctx.fillRect(pad + c * cellW + 1, pad + r * cellH + 1, cellW - 2, cellH - 2)
      }
    }
  },
})
