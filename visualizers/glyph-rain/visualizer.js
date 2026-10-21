// Glyph rain: columns of falling characters. Each column belongs to a band and falls faster
// the louder it is; its leading glyph glows.
const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ΣΔΨΩ#$%&*+<>'
const heads = []
const glyphs = []
let lastTime = 0

piratify.register({
  trails: true,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, time } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    const size = Math.max(6, Math.round(Math.min(w, h) / 24))
    const cols = Math.max(1, Math.floor(w / size))
    ctx.font = `${size}px monospace`
    for (let c = 0; c < cols; c++) {
      if (heads[c] === undefined) { heads[c] = Math.random() * h; glyphs[c] = 0 }
      const v = levels[Math.floor((c / cols) * levels.length)]
      const before = Math.floor(heads[c] / size)
      heads[c] += dt * size * (2 + v * 22)
      if (heads[c] > h + size * 4) heads[c] = -Math.random() * h * 0.5
      const row = Math.floor(heads[c] / size)
      if (row !== before) glyphs[c] = Math.floor(Math.random() * CHARS.length)
      const ch = CHARS[glyphs[c]]
      const x = c * size
      const y = row * size
      ctx.fillStyle = `rgba(${rgb}, ${0.35 + v * 0.65})`
      ctx.fillText(CHARS[(glyphs[c] + 7) % CHARS.length], x, y - size)
      ctx.fillStyle = v > 0.5 ? soft : `rgba(${rgb}, 0.9)`
      ctx.fillText(ch, x, y)
    }
  },
})
