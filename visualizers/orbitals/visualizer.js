// Orbitals: a little solar system. The sun breathes with the bass, eight planets carry one
// frequency range each: louder means bigger and faster, leaving a comet tail.
const angles = [0, 1.3, 2.1, 3.7, 0.6, 4.4, 5.2, 2.9]
let lastTime = 0

piratify.register({
  trails: true,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, accentRgb, time, bass } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    const cx = w / 2
    const cy = h / 2
    const R = Math.max(1, Math.min(w, h) * 0.47)
    ctx.fillStyle = soft
    ctx.globalAlpha = 0.6 + bass * 0.4
    ctx.beginPath()
    ctx.arc(cx, cy, Math.max(0.5, R * (0.08 + bass * 0.06)), 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    for (let p = 0; p < 8; p++) {
      let v = 0
      for (let k = 0; k < 8; k++) v += levels[p * 8 + k]
      v /= 8
      const orbit = R * (0.2 + p * 0.105)
      angles[p] += dt * (1.6 / (1 + p * 0.5)) * (0.3 + v * 2.2)
      const x = cx + Math.cos(angles[p]) * orbit
      const y = cy + Math.sin(angles[p]) * orbit * 0.62 // seen at a slant
      ctx.strokeStyle = `rgba(${rgb}, 0.05)`
      ctx.beginPath()
      ctx.ellipse(cx, cy, Math.max(0.5, orbit), Math.max(0.5, orbit * 0.62), 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = `rgba(${p % 3 === 2 ? accentRgb : rgb}, ${0.5 + v * 0.5})`
      ctx.beginPath()
      ctx.arc(x, y, Math.max(0.5, 2 + v * R * 0.05), 0, Math.PI * 2)
      ctx.fill()
    }
  },
})
