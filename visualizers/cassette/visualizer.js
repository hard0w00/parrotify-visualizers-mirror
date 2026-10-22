// Cassette: a mixtape playing. The reels spin with the energy (the left one empties, the right
// one fills over time), a little spectrum glows in the label window.
let angle = 0
let lastTime = 0

piratify.register({
  trails: false,
  color: '#ff6f61',
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, time, energy, bass } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    angle += dt * (1 + energy * 6)
    const cw = Math.min(w * 0.8, h * 1.3)
    const ch = cw * 0.63
    const x0 = (w - cw) / 2
    const y0 = (h - ch) / 2 + Math.sin(time * 8) * bass * 2
    const r = cw * 0.04
    // body
    ctx.fillStyle = 'rgba(30, 28, 36, 0.98)'
    rounded(ctx, x0, y0, cw, ch, r)
    ctx.fill()
    ctx.strokeStyle = 'rgba(80, 76, 90, 1)'
    ctx.lineWidth = 2
    ctx.stroke()
    // label in the colour, with two stripes
    const lx = x0 + cw * 0.06
    const ly = y0 + ch * 0.08
    const lw = cw * 0.88
    const lh = ch * 0.6
    ctx.fillStyle = 'rgba(245, 238, 225, 0.95)'
    rounded(ctx, lx, ly, lw, lh, r * 0.6)
    ctx.fill()
    ctx.fillStyle = `rgba(${rgb}, 0.9)`
    ctx.fillRect(lx, ly + lh * 0.18, lw, lh * 0.07)
    ctx.fillStyle = `rgba(${accentRgb}, 0.9)`
    ctx.fillRect(lx, ly + lh * 0.27, lw, lh * 0.04)
    ctx.fillStyle = 'rgba(40, 30, 50, 0.9)'
    ctx.font = `italic ${Math.max(6, Math.round(lh * 0.12))}px cursive`
    ctx.fillText('mixtape ♥', lx + lw * 0.05, ly + lh * 0.14)
    // window with the reels
    const wx = lx + lw * 0.2
    const wy = ly + lh * 0.4
    const ww = lw * 0.6
    const wh = lh * 0.48
    ctx.fillStyle = 'rgba(20, 16, 26, 1)'
    rounded(ctx, wx, wy, ww, wh, wh * 0.5)
    ctx.fill()
    // spectrum glowing between the reels
    const sx = wx + ww * 0.3
    const sw = ww * 0.4
    for (let i = 0; i < 16; i++) {
      const v = levels[i * 4]
      ctx.fillStyle = `rgba(${rgb}, ${0.3 + v * 0.7})`
      ctx.fillRect(sx + (i / 16) * sw, wy + wh * 0.85 - v * wh * 0.7, sw / 16 - 1, v * wh * 0.7)
    }
    const progress = (time / 120) % 1
    const reelR = wh * 0.42
    for (const side of [0, 1]) {
      const cx = side ? wx + ww - wh * 0.5 : wx + wh * 0.5
      const cy = wy + wh / 2
      const tape = reelR * (0.45 + 0.55 * (side ? progress : 1 - progress))
      ctx.fillStyle = 'rgba(70, 45, 30, 0.95)'
      ctx.beginPath()
      ctx.arc(cx, cy, tape, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(240, 240, 240, 0.95)'
      ctx.beginPath()
      ctx.arc(cx, cy, reelR * 0.38, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(20, 16, 26, 1)'
      ctx.lineWidth = Math.max(1, reelR * 0.08)
      for (let k = 0; k < 6; k++) {
        const a = angle * (side ? 1.4 - progress * 0.6 : 0.8 + progress * 0.6) + (k * Math.PI) / 3
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * reelR * 0.15, cy + Math.sin(a) * reelR * 0.15)
        ctx.lineTo(cx + Math.cos(a) * reelR * 0.36, cy + Math.sin(a) * reelR * 0.36)
        ctx.stroke()
      }
    }
    // bottom trapezoid with the screw holes
    ctx.fillStyle = 'rgba(50, 46, 58, 1)'
    ctx.beginPath()
    ctx.moveTo(x0 + cw * 0.2, y0 + ch)
    ctx.lineTo(x0 + cw * 0.25, y0 + ch * 0.76)
    ctx.lineTo(x0 + cw * 0.75, y0 + ch * 0.76)
    ctx.lineTo(x0 + cw * 0.8, y0 + ch)
    ctx.fill()
    ctx.fillStyle = 'rgba(15, 12, 20, 1)'
    for (const p of [0.33, 0.45, 0.55, 0.67]) {
      ctx.beginPath()
      ctx.arc(x0 + cw * p, y0 + ch * 0.9, Math.max(1, cw * 0.012), 0, Math.PI * 2)
      ctx.fill()
    }
  },
})

function rounded(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
