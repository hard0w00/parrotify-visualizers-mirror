// Miami: palm silhouettes in front of a sinking striped sun. The sun's reflection ripples on
// the water, each ripple line as wide as its band; the sky warms up with the energy.
parrotify.register({
  trails: false,
  color: '#ff7a59',
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, time, bass, energy } = f
    const horizon = h * 0.62
    const sky = ctx.createLinearGradient(0, 0, 0, horizon)
    sky.addColorStop(0, 'rgba(25, 8, 60, 0.95)')
    sky.addColorStop(0.55, `rgba(${accentRgb}, ${0.55 + energy * 0.3})`)
    sky.addColorStop(1, 'rgba(255, 150, 80, 0.95)')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, horizon)
    // sun
    const sr = Math.max(1, Math.min(w, h) * (0.2 + bass * 0.03))
    const sx = w * 0.5
    const sy = horizon - sr * 0.45
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, w, horizon)
    ctx.clip()
    const sun = ctx.createLinearGradient(0, sy - sr, 0, sy + sr)
    sun.addColorStop(0, 'rgba(255, 240, 120, 1)')
    sun.addColorStop(1, 'rgba(255, 60, 120, 1)')
    ctx.fillStyle = sun
    ctx.beginPath()
    ctx.arc(sx, sy, sr, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'destination-out'
    for (let k = 1; k < 7; k++) ctx.fillRect(sx - sr, sy + (k / 7) * sr, sr * 2, k * 1.1)
    ctx.restore()
    // water with the sun's reflection as broken lines, each line one band
    const water = ctx.createLinearGradient(0, horizon, 0, h)
    water.addColorStop(0, 'rgba(40, 10, 70, 0.95)')
    water.addColorStop(1, 'rgba(8, 2, 20, 0.95)')
    ctx.fillStyle = water
    ctx.fillRect(0, horizon, w, h - horizon)
    const lines = 22
    for (let k = 0; k < lines; k++) {
      const p = k / lines
      const y = horizon + 2 + Math.pow(p, 1.5) * (h - horizon - 2)
      const v = levels[Math.floor(p * 40)]
      const half = sr * (1 - p * 0.5) * (0.3 + v * 0.9)
      const off = Math.sin(time * 2 + k * 0.9) * sr * 0.08
      ctx.fillStyle = `rgba(255, ${180 - p * 120}, ${120 + p * 60}, ${0.8 - p * 0.5})`
      ctx.fillRect(sx - half + off, y, half * 2, 1.5 + p * 2)
    }
    // shimmer of the colour choice on the far water
    ctx.fillStyle = `rgba(${rgb}, 0.25)`
    for (let i = 0; i < 48; i++) {
      const x = ((i * 7919) % 997) / 997 * w
      const y = horizon + (((i * 31) % 17) / 17) * (h - horizon)
      ctx.fillRect(x + Math.sin(time + i) * 6, y, 6 + levels[i] * 18, 1)
    }
    // palms: two on the left, one on the right, leaning in
    palm(ctx, w * 0.1, horizon + h * 0.08, h * 0.75, 1, levels[3], time)
    palm(ctx, w * 0.2, horizon + h * 0.04, h * 0.5, 1, levels[10], time + 1)
    palm(ctx, w * 0.88, horizon + h * 0.1, h * 0.68, -1, levels[30], time + 2)
  },
})

// black palm: curved trunk, eight drooping fronds that sway with its band
function palm(ctx, x, y, size, side, v, time) {
  const tx = x + side * size * 0.28
  const ty = y - size
  ctx.strokeStyle = 'rgba(6, 0, 12, 1)'
  ctx.fillStyle = 'rgba(6, 0, 12, 1)'
  ctx.lineWidth = Math.max(1.5, size * 0.035)
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.quadraticCurveTo(x + side * size * 0.02, y - size * 0.6, tx, ty)
  ctx.stroke()
  const sway = Math.sin(time * 1.5) * 0.06 + v * 0.18
  for (let k = 0; k < 8; k++) {
    const a = -Math.PI / 2 + (k - 3.5) * 0.45 + sway * side
    const len = size * (0.3 + (k % 2) * 0.05)
    const ex = tx + Math.cos(a) * len
    const ey = ty + Math.sin(a) * len * 0.45 + len * 0.45
    ctx.beginPath()
    ctx.moveTo(tx, ty)
    ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.55, ty + Math.sin(a) * len * 0.7 - len * 0.12, ex, ey)
    ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.5, ty + Math.sin(a) * len * 0.45, tx, ty)
    ctx.fill()
  }
}
