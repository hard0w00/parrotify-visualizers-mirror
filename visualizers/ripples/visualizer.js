// Ripples: a calm surface seen from above. Peaks in each frequency range drop a stone at its
// own spot; the rings spread, overlap and fade.
const rings = []
const last = new Float32Array(8)
let lastTime = 0

// eight fixed spots, spread like a dice pattern
const SPOTS = [[0.2, 0.3], [0.5, 0.2], [0.8, 0.3], [0.35, 0.55], [0.65, 0.55], [0.2, 0.8], [0.5, 0.85], [0.8, 0.8]]

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, accentRgb, time } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    for (let g = 0; g < 8; g++) {
      let v = 0
      for (let k = 0; k < 8; k++) v += levels[g * 8 + k]
      v /= 8
      if (v - last[g] > 0.05 && v > 0.2 && rings.length < 80) {
        rings.push({ x: SPOTS[g][0] * w, y: SPOTS[g][1] * h, r: 0, life: 1, strength: v, col: g % 2 ? accentRgb : rgb })
      }
      last[g] = v
      ctx.fillStyle = `rgba(${rgb}, ${0.1 + v * 0.4})`
      ctx.beginPath()
      ctx.arc(SPOTS[g][0] * w, SPOTS[g][1] * h, Math.max(0.5, 2 + v * 4), 0, Math.PI * 2)
      ctx.fill()
    }
    const maxR = Math.max(w, h) * 0.6
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i]
      r.r += dt * maxR * 0.45
      r.life = 1 - r.r / maxR
      if (r.life <= 0) {
        rings.splice(i, 1)
        continue
      }
      for (let k = 0; k < 3; k++) { // a ripple is a few close rings
        const rr = r.r - k * 7
        if (rr <= 0) continue
        ctx.strokeStyle = k === 0 && r.life > 0.85 ? soft : `rgba(${r.col}, ${r.life * r.strength * (0.9 - k * 0.25)})`
        ctx.lineWidth = 1.5 - k * 0.4
        ctx.beginPath()
        ctx.arc(r.x, r.y, rr, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  },
})
