// Invaders: pixel invaders march in formation, side to side and slowly down. Each column
// listens to a band: it lights up and hops with it; strong beats flash the cannon at the bottom.
const SHAPES = [
  ['00100000100', '00010001000', '00111111100', '01101110110', '11111111111', '10111111101', '10100000101', '00011011000'],
  ['00001111000', '01111111110', '11111111111', '11100110011', '11111111111', '00011001100', '00110110110', '11000000011'],
  ['00011100000', '00111110000', '01111111000', '11011011000', '11111111000', '00100100000', '01011010000', '10100101000'],
]

piratify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, time, bass } = f
    const cols = 11
    const rows = 4
    const px = Math.max(1, Math.min(w / (cols * 16), h / (rows * 16)))
    const cellW = px * 14
    const cellH = px * 12
    const march = Math.sin(time * 0.8) * (w - cols * cellW) * 0.4
    const drop = ((time * 4) % 40) * px * 0.2
    const ox = (w - cols * cellW) / 2 + march
    const oy = h * 0.08 + drop
    const frame = Math.floor(time * 2) % 2 // legs wiggle
    for (let c = 0; c < cols; c++) {
      const v = levels[Math.floor((c / cols) * 60)]
      const hop = v * px * 6
      for (let r = 0; r < rows; r++) {
        const shape = SHAPES[r === 0 ? 2 : r < 3 ? 0 : 1]
        const lit = v > 0.15 + r * 0.15
        ctx.fillStyle = lit ? `rgba(${r % 2 ? rgb : accentRgb}, ${0.6 + v * 0.4})` : `rgba(${rgb}, 0.18)`
        const x0 = ox + c * cellW
        const y0 = oy + r * cellH - hop
        for (let y = 0; y < shape.length; y++) {
          const line = y >= 6 && frame ? shape[shape.length - 1 - (y - 6)] : shape[y]
          for (let x = 0; x < line.length; x++) {
            if (line[x] === '1') ctx.fillRect(x0 + x * px, y0 + y * px, px, px)
          }
        }
      }
    }
    // cannon and shield bunkers
    ctx.fillStyle = `rgba(${rgb}, 0.8)`
    const gx = w / 2 + Math.sin(time * 1.3) * w * 0.3
    const gy = h - px * 10
    ctx.fillRect(gx - px * 6, gy + px * 3, px * 12, px * 4)
    ctx.fillRect(gx - px, gy, px * 2, px * 3)
    if (bass > 0.6) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.fillRect(gx - px * 0.5, oy + rows * cellH, px, gy - oy - rows * cellH)
    }
    ctx.fillStyle = `rgba(${accentRgb}, 0.5)`
    for (let b = 0; b < 4; b++) {
      const bx = ((b + 0.5) / 4) * w - px * 8
      ctx.fillRect(bx, h - px * 22, px * 16, px * 6)
    }
  },
})
