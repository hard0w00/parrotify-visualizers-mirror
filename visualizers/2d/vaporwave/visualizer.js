// Vaporwave: pink and teal dusk over a checkered grid floor. A wireframe pyramid floats in the
// middle, spinning with the mids and swelling with the bass; marble columns frame the scene.
let spin = 0
let travel = 0
let lastTime = 0

parrotify.register({
  trails: false,
  color: '#22e4d4',
  draw(ctx, f) {
    const { levels, w, h, rgb, time, bass, mid, energy } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    spin += dt * (0.3 + mid * 2)
    travel += dt * (0.2 + energy * 1.2)
    const horizon = h * 0.6
    const sky = ctx.createLinearGradient(0, 0, 0, horizon)
    sky.addColorStop(0, 'rgba(40, 10, 70, 0.95)')
    sky.addColorStop(0.6, 'rgba(255, 90, 170, 0.75)')
    sky.addColorStop(1, 'rgba(255, 190, 120, 0.85)')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, horizon)
    // floor: dark with a teal grid running towards the viewer
    ctx.fillStyle = 'rgba(14, 6, 30, 0.95)'
    ctx.fillRect(0, horizon, w, h - horizon)
    ctx.strokeStyle = `rgba(${rgb}, 0.8)`
    ctx.lineWidth = 1
    for (let k = 0; k < 12; k++) {
      const z = (k + travel % 1) / 12
      const y = horizon + Math.pow(z, 2) * (h - horizon)
      ctx.globalAlpha = 0.2 + z * 0.8
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    for (let k = -10; k <= 10; k++) {
      ctx.beginPath()
      ctx.moveTo(w / 2 + k * w * 0.04, horizon)
      ctx.lineTo(w / 2 + k * w * 0.25, h)
      ctx.stroke()
    }
    // spectrum reflected as a shimmer on the floor
    for (let i = 0; i < 32; i++) {
      const v = levels[i * 2]
      ctx.fillStyle = `rgba(255, 120, 200, ${v * 0.35})`
      ctx.fillRect((i / 32) * w, horizon, w / 32 - 1, v * (h - horizon) * 0.5)
    }
    // columns left and right, their fluting lit by low and high bands
    const colW = Math.max(4, w * 0.06)
    for (const side of [0, 1]) {
      const x = side ? w - colW * 2 : colW
      const v = levels[side ? 48 : 4]
      ctx.fillStyle = 'rgba(235, 225, 245, 0.85)'
      ctx.fillRect(x - colW * 0.2, h * 0.12, colW * 1.4, h * 0.04)
      ctx.fillRect(x - colW * 0.2, h * 0.84, colW * 1.4, h * 0.04)
      ctx.fillRect(x, h * 0.16, colW, h * 0.68)
      ctx.fillStyle = `rgba(${rgb}, ${0.2 + v * 0.7})`
      for (let k = 1; k < 4; k++) ctx.fillRect(x + (k * colW) / 4 - 1, h * 0.17, 2, h * 0.66)
    }
    // pyramid: four base corners and a tip, rotated about the vertical axis
    const s = Math.min(w, h) * (0.16 + bass * 0.08)
    const cx = w / 2
    const cy = h * 0.42 + Math.sin(time * 1.3) * h * 0.02
    const pts = []
    for (let k = 0; k < 4; k++) {
      const a = spin + (k * Math.PI) / 2
      pts.push([cx + Math.cos(a) * s, cy + s * 0.5 + Math.sin(a) * s * 0.3])
    }
    const tip = [cx, cy - s * 0.9]
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.shadowColor = `rgba(${rgb}, 1)`
    ctx.shadowBlur = 14
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let k = 0; k < 4; k++) {
      const [x0, y0] = pts[k]
      const [x1, y1] = pts[(k + 1) % 4]
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.moveTo(x0, y0)
      ctx.lineTo(tip[0], tip[1])
    }
    ctx.stroke()
    ctx.shadowBlur = 0
  },
})
