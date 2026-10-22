// Terrain: a neon wireframe landscape you fly over. Every few frames the current spectrum
// becomes a new ridge at the front; older ridges recede towards the sunset at the horizon.
const ROWS = 28
const COLS = 33
const rows = [] // newest first, each a Float32Array(COLS)
let scroll = 0
let lastTime = 0

piratify.register({
  trails: false,
  color: '#ff4fd8',
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, time, bass, energy } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    scroll += dt * (2 + energy * 10)
    while (scroll >= 1 || rows.length === 0) {
      scroll = Math.max(0, scroll - 1)
      const row = new Float32Array(COLS)
      for (let c = 0; c < COLS; c++) {
        const p = Math.abs(c / (COLS - 1) - 0.5) * 2 // valley in the middle, peaks at the sides
        row[c] = levels[Math.floor(p * 63)] * (0.3 + p * 0.9)
      }
      rows.unshift(row)
      if (rows.length > ROWS) rows.pop()
    }
    const horizon = h * 0.42
    const sky = ctx.createLinearGradient(0, 0, 0, horizon)
    sky.addColorStop(0, 'rgba(8, 2, 22, 0.9)')
    sky.addColorStop(1, `rgba(${accentRgb}, 0.45)`)
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, horizon)
    const sr = Math.max(1, Math.min(w, h) * (0.14 + bass * 0.04))
    ctx.fillStyle = 'rgba(255, 200, 90, 0.9)'
    ctx.beginPath()
    ctx.arc(w / 2, horizon, sr, Math.PI, 0)
    ctx.fill()
    ctx.fillStyle = 'rgba(8, 2, 22, 0.95)'
    ctx.fillRect(0, horizon, w, h - horizon)
    // project row r (0 = front) / column c to the screen
    const proj = (r, c, v) => {
      const z = 1 + (r + scroll) * 0.6
      const x = w / 2 + ((c / (COLS - 1) - 0.5) * w * 2.2) / z
      const y = horizon + (h * 0.9) / z - (v * h * 0.9) / z
      return [x, y]
    }
    ctx.lineWidth = 1.2
    // back to front, so each ridge's dark fill hides the lines behind it
    for (let r = rows.length - 1; r >= 0; r--) {
      const row = rows[r]
      const fade = 1 - r / ROWS
      ctx.beginPath()
      for (let c = 0; c < COLS; c++) {
        const [x, y] = proj(r, c, row[c])
        if (c === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      const [xr] = proj(r, COLS - 1, 0)
      const [xl] = proj(r, 0, 0)
      ctx.lineTo(xr, h)
      ctx.lineTo(xl, h)
      ctx.closePath()
      ctx.fillStyle = 'rgba(8, 2, 22, 0.92)'
      ctx.fill()
      ctx.beginPath()
      for (let c = 0; c < COLS; c++) {
        const [x, y] = proj(r, c, row[c])
        if (c === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = `rgba(${rgb}, ${0.15 + fade * 0.85})`
      ctx.stroke()
      // lines between this ridge and the one behind it
      if (r + 1 < rows.length) {
        ctx.beginPath()
        for (let c = 0; c < COLS; c += 2) {
          const [x0, y0] = proj(r, c, row[c])
          const [x1, y1] = proj(r + 1, c, rows[r + 1][c])
          ctx.moveTo(x0, y0)
          ctx.lineTo(x1, y1)
        }
        ctx.strokeStyle = `rgba(${rgb}, ${0.08 + fade * 0.4})`
        ctx.stroke()
      }
    }
  },
})
