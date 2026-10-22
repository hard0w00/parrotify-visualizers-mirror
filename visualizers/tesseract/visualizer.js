// Tesseract: a four-dimensional cube turning in two planes at once, projected to 3D and then
// to the screen. The bass pushes the inner cube out, the edges glow with their bands.
const verts = []
for (let i = 0; i < 16; i++) verts.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1])
const edges = []
for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) if (!(i & (1 << b))) edges.push([i, i | (1 << b)])
let a1 = 0
let a2 = 0
let lastTime = 0

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, time, bass, mid } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    a1 += dt * (0.4 + mid * 1.2)
    a2 += dt * (0.25 + bass * 0.8)
    const scale = Math.min(w, h) * 0.22
    const wDist = 2.6 - bass * 0.6 // closer in 4D: inner cube grows
    const pts = verts.map(([x, y, z, q]) => {
      // rotate in the x-w plane and the y-z plane
      const x1 = x * Math.cos(a1) - q * Math.sin(a1)
      const q1 = x * Math.sin(a1) + q * Math.cos(a1)
      const y1 = y * Math.cos(a2) - z * Math.sin(a2)
      const z1 = y * Math.sin(a2) + z * Math.cos(a2)
      const k4 = 1 / (wDist - q1)
      const x3 = x1 * k4
      const y3 = y1 * k4
      const z3 = z1 * k4
      // slow turn around the vertical axis in 3D, then perspective
      const c = Math.cos(time * 0.3)
      const s = Math.sin(time * 0.3)
      const xr = x3 * c - z3 * s
      const zr = x3 * s + z3 * c
      const k3 = 2.5 / (3 - zr)
      return [w / 2 + xr * k3 * scale * 1.6, h / 2 + y3 * k3 * scale * 1.6, q1]
    })
    ctx.lineCap = 'round'
    edges.forEach(([i, j], e) => {
      const v = levels[(e * 2) % 64]
      const inner = pts[i][2] + pts[j][2] < 0
      ctx.strokeStyle = inner ? `rgba(${accentRgb}, ${0.4 + v * 0.6})` : `rgba(${rgb}, ${0.5 + v * 0.5})`
      ctx.lineWidth = 1 + v * 3
      ctx.beginPath()
      ctx.moveTo(pts[i][0], pts[i][1])
      ctx.lineTo(pts[j][0], pts[j][1])
      ctx.stroke()
    })
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    for (const [x, y] of pts) ctx.fillRect(x - 2, y - 2, 4, 4)
  },
})
