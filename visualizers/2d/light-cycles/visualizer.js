// Light Cycles: cycles race over a neon grid, turn on the beats and leave glowing walls that
// slowly fade. Each cycle listens to its own part of the spectrum for its speed.
const WALL = 2.2 // wall length in screen heights
const cycles = []
let lastTime = 0
let lastBass = 0

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, time, bass } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    const beat = bass > 0.55 && bass - lastBass > 0.08
    lastBass = bass
    if (cycles.length === 0) {
      for (let k = 0; k < 4; k++) {
        const x = 0.2 + k * 0.2
        cycles.push({ x, y: 0.3 + (k % 2) * 0.4, dir: k % 4, band: k * 16 + 2, seed: k * 7919 + 1, path: [[x, 0.3 + (k % 2) * 0.4]] })
      }
    }
    // faint grid
    ctx.strokeStyle = `rgba(${rgb}, 0.1)`
    ctx.lineWidth = 1
    const step = Math.max(8, Math.min(w, h) / 12)
    ctx.beginPath()
    for (let x = step / 2; x < w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h) }
    for (let y = step / 2; y < h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
    ctx.stroke()
    const aspect = w > 0 && h > 0 ? h / w : 1
    const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]]
    const inside = (x, y) => x > 0.03 && x < 0.97 && y > 0.05 && y < 0.95
    cycles.forEach((c, k) => {
      const v = levels[c.band]
      const speed = (0.12 + v * 0.45) * dt
      c.seed = (c.seed * 16807) % 2147483647
      // turn on a beat (randomly left or right), sometimes on its own, and before hitting the edge
      const [ax, ay] = dirs[c.dir]
      const blocked = !inside(c.x + ax * 0.04 * aspect, c.y + ay * 0.04)
      if (beat || blocked || c.seed % 240 === 0) {
        let turn = c.seed % 2 ? 1 : 3
        const [nx, ny] = dirs[(c.dir + turn) % 4]
        if (!inside(c.x + nx * 0.06 * aspect, c.y + ny * 0.06)) turn = 4 - turn
        c.dir = (c.dir + turn) % 4
        c.path.push([c.x, c.y])
      }
      const [dx, dy] = dirs[c.dir]
      c.x = Math.min(0.99, Math.max(0.01, c.x + dx * speed * aspect))
      c.y = Math.min(0.99, Math.max(0.01, c.y + dy * speed))
      // keep only the last WALL screen heights of wall
      let len = 0
      let px = c.x
      let py = c.y
      for (let i = c.path.length - 1; i >= 0; i--) {
        len += Math.abs(c.path[i][0] - px) / aspect + Math.abs(c.path[i][1] - py)
        px = c.path[i][0]
        py = c.path[i][1]
        if (len > WALL) { c.path.splice(0, i); break }
      }
      const col = k % 2 ? rgb : accentRgb
      ctx.strokeStyle = `rgba(${col}, ${0.55 + v * 0.45})`
      ctx.shadowColor = `rgba(${col}, 1)`
      ctx.shadowBlur = 10 + v * 10
      ctx.lineWidth = 2 + v * 2
      ctx.lineJoin = 'miter'
      ctx.beginPath()
      c.path.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)))
      ctx.lineTo(c.x * w, c.y * h)
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.fillRect(c.x * w - 3, c.y * h - 3, 6, 6)
    })
  },
})
