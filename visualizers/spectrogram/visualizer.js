// Spectrogram: a scrolling heat map of the spectrum. Each frame adds a column on the right,
// bass at the bottom, treble on top; quiet is dark, loud runs through the colour into white.
const COLS = 120
const history = [] // newest last, each a Float32Array(64)

piratify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb } = f
    history.push(Float32Array.from(levels))
    if (history.length > COLS) history.shift()
    const cw = w / COLS
    const rh = h / 64
    const x0 = w - history.length * cw
    for (let c = 0; c < history.length; c++) {
      const col = history[c]
      for (let b = 0; b < 64; b++) {
        const v = col[b]
        if (v < 0.04) continue
        ctx.fillStyle = v < 0.6 ? `rgba(${rgb}, ${v * 1.6})` : `rgba(255, 255, ${Math.round(150 + v * 100)}, ${0.6 + v * 0.4})`
        ctx.fillRect(x0 + c * cw, h - (b + 1) * rh, cw + 0.5, rh + 0.5)
      }
    }
  },
})
