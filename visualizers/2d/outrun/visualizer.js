// Outrun: a night drive into a striped sunset. The road's stripes and the palm trees rush
// by faster with the music, the sun pulses with the bass, the sky glows with the highs.
let travel = 0
let lastTime = 0

parrotify.register({
  trails: false,
  color: '#ff3cac',
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, time, bass, high, energy } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    travel += dt * (0.4 + energy * 3)
    const horizon = h * 0.55
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, horizon)
    sky.addColorStop(0, 'rgba(10, 4, 30, 0.9)')
    sky.addColorStop(1, `rgba(${rgb}, ${0.25 + high * 0.3})`)
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, horizon)
    // stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    for (let i = 0; i < 40; i++) {
      const x = ((i * 7919) % 997) / 997 * w
      const y = ((i * 104729) % 991) / 991 * horizon * 0.7
      const tw = 0.5 + 0.5 * Math.sin(time * 2 + i)
      ctx.globalAlpha = tw * (0.3 + levels[(i * 3) % 64] * 0.7)
      ctx.fillRect(x, y, 1.5, 1.5)
    }
    ctx.globalAlpha = 1
    // sun: gradient disc with stripes cut out of the lower half
    const sr = Math.max(1, Math.min(w, h) * (0.2 + bass * 0.05))
    const sx = w / 2
    const sy = horizon - sr * 0.2
    const sun = ctx.createLinearGradient(0, sy - sr, 0, sy + sr)
    sun.addColorStop(0, 'rgba(255, 230, 90, 1)')
    sun.addColorStop(1, `rgba(${accentRgb}, 1)`)
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, w, horizon)
    ctx.clip()
    ctx.shadowColor = 'rgba(255, 120, 160, 0.8)'
    ctx.shadowBlur = 30 + bass * 30
    ctx.fillStyle = sun
    ctx.beginPath()
    ctx.arc(sx, sy, sr, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.globalCompositeOperation = 'destination-out'
    // stripes between the sun's middle and the horizon, drifting down, thicker further down
    const top = sy - sr * 0.55
    const gap = (horizon - top) / 6
    for (let k = 0; k < 7; k++) {
      const y0 = top + k * gap + ((time * 10) % gap)
      ctx.fillRect(sx - sr, y0, sr * 2, 1 + ((y0 - top) / (horizon - top)) * gap * 0.55)
    }
    ctx.restore()
    // ground
    const ground = ctx.createLinearGradient(0, horizon, 0, h)
    ground.addColorStop(0, 'rgba(30, 6, 50, 0.95)')
    ground.addColorStop(1, 'rgba(6, 2, 14, 0.95)')
    ctx.fillStyle = ground
    ctx.fillRect(0, horizon, w, h - horizon)
    // road: a trapezoid with neon edges and dashes
    const roadTop = w * 0.01
    const roadBottom = w * 0.42
    ctx.fillStyle = 'rgba(15, 8, 25, 1)'
    ctx.beginPath()
    ctx.moveTo(sx - roadTop, horizon)
    ctx.lineTo(sx + roadTop, horizon)
    ctx.lineTo(sx + roadBottom, h)
    ctx.lineTo(sx - roadBottom, h)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = `rgba(${rgb}, 0.95)`
    ctx.lineWidth = 2
    ctx.shadowColor = `rgba(${rgb}, 1)`
    ctx.shadowBlur = 10
    ctx.stroke()
    ctx.shadowBlur = 0
    // dashes and roadside palms share the same depth function
    const depth = (z) => Math.pow(z, 2.4) // 0 = horizon, 1 = bottom edge
    ctx.fillStyle = 'rgba(255, 240, 200, 0.85)'
    for (let k = 0; k < 10; k++) {
      const z0 = (k + (travel * 2) % 1) / 10
      const z1 = z0 + 0.04
      const y0 = horizon + depth(z0) * (h - horizon)
      const y1 = Math.min(h, horizon + depth(z1) * (h - horizon))
      const hw0 = 0.5 + depth(z0) * w * 0.006
      const hw1 = 0.5 + depth(Math.min(1, z1)) * w * 0.006
      ctx.beginPath()
      ctx.moveTo(sx - hw0, y0)
      ctx.lineTo(sx + hw0, y0)
      ctx.lineTo(sx + hw1, y1)
      ctx.lineTo(sx - hw1, y1)
      ctx.fill()
    }
    // palms on both sides, nearest last so they cover the far ones
    for (let k = 0; k < 6; k++) {
      const z = (k + travel % 1) / 6
      const d = depth(z)
      const y = horizon + d * (h - horizon)
      const size = 4 + d * h * 0.55
      for (const side of [-1, 1]) {
        const x = sx + side * (roadTop + (roadBottom - roadTop) * d + size * 0.5)
        palm(ctx, x, y, size, side, levels[(k * 9 + (side > 0 ? 5 : 0)) % 64], time)
      }
    }
    // spectrum as a faint equaliser along the horizon
    ctx.fillStyle = `rgba(${rgb}, 0.5)`
    for (let i = 0; i < 64; i++) {
      const v = levels[i]
      const bw = w / 64
      ctx.fillRect(i * bw, horizon - v * h * 0.06, bw - 1, v * h * 0.06)
    }
  },
})

// a black palm silhouette: bent trunk and six fronds that sway with its band
function palm(ctx, x, y, size, side, v, time) {
  const top = y - size
  const lean = side * size * 0.15
  ctx.strokeStyle = 'rgba(5, 0, 10, 0.95)'
  ctx.fillStyle = 'rgba(5, 0, 10, 0.95)'
  ctx.lineWidth = Math.max(1, size * 0.04)
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.quadraticCurveTo(x + lean * 0.2, y - size * 0.5, x + lean, top)
  ctx.stroke()
  const sway = Math.sin(time * 2 + x) * 0.1 + v * 0.25
  for (let k = 0; k < 6; k++) {
    const a = -Math.PI / 2 + (k - 2.5) * 0.55 + sway
    const len = size * 0.42
    const ex = x + lean + Math.cos(a) * len
    const ey = top + Math.sin(a) * len * 0.6 + len * 0.35
    ctx.beginPath()
    ctx.moveTo(x + lean, top)
    ctx.quadraticCurveTo(x + lean + Math.cos(a) * len * 0.6, top + Math.sin(a) * len * 0.6 - len * 0.1, ex, ey)
    ctx.quadraticCurveTo(x + lean + Math.cos(a) * len * 0.5, top + Math.sin(a) * len * 0.4, x + lean, top)
    ctx.fill()
  }
}
