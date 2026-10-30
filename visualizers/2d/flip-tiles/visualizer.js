// Flip tiles: a wall of tiles like an airport departure board. A tile flips over whenever its
// band crosses a threshold; the back side shows the accent colour.
const flip = []
const shown = []

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, time } = f
    const cols = 16
    const rows = 9
    const tw = w / cols
    const th = h / rows
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const i = c * rows + r
        const v = levels[Math.floor((c / cols) * levels.length)]
        const want = v > (rows - r) / (rows + 1) ? 1 : 0 // a column fills from the bottom
        if (shown[i] === undefined) { shown[i] = want; flip[i] = 0 }
        if (want !== shown[i] && flip[i] === 0) flip[i] = 1
        let side = shown[i]
        let scale = 1
        if (flip[i] > 0) {
          flip[i] = Math.max(0, flip[i] - 0.12)
          scale = Math.abs(Math.cos((1 - flip[i]) * Math.PI))
          if (flip[i] < 0.5) side = want
          if (flip[i] === 0) shown[i] = want
        }
        const x = c * tw
        const y = r * th + (th * (1 - scale)) / 2
        const glow = 0.5 + 0.5 * Math.sin(time * 2 + c * 0.4 + r * 0.7)
        ctx.fillStyle = side ? `rgba(${accentRgb}, ${0.55 + v * 0.45})` : `rgba(${rgb}, ${0.08 + glow * 0.06})`
        ctx.fillRect(x + 1.5, y + 1, Math.max(0, tw - 3), Math.max(0, th * scale - 2))
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
        ctx.fillRect(x + 1.5, r * th + th / 2, Math.max(0, tw - 3), 1) // the split of the tile
      }
    }
  },
})
