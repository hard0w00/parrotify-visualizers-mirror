// Disco: a spinning mirror ball hangs from the ceiling and throws light spots across the room.
// The spots swirl with the ball, flash brighter on the bass and take the colour of their band.
let spin = 0
let lastTime = 0

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, time, bass, energy } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    spin += dt * (0.3 + energy * 0.8)
    const bx = w / 2
    const by = h * 0.3
    const br = Math.min(w, h) * 0.13
    // light spots on the walls: fixed directions on the ball, turning with it
    ctx.globalCompositeOperation = 'lighter'
    const spots = 110
    for (let k = 0; k < spots; k++) {
      const lat = (((k * 37) % spots) / spots - 0.5) * Math.PI * 0.9
      const lon = k * 2.399 + spin // golden angle spreads them evenly
      const x3 = Math.cos(lat) * Math.sin(lon)
      const z3 = Math.cos(lat) * Math.cos(lon)
      if (z3 < 0) continue // facing away from us: hits the wall behind the viewer
      const v = levels[k % 64]
      const x = bx + x3 * w * 0.62
      const y = by + br + (Math.sin(lat) + 0.35) * h * 0.75
      const s = Math.max(1.5, Math.min(w, h) * (0.012 + v * 0.02) * (0.5 + z3 * 0.7))
      const col = k % 3 === 0 ? '255, 255, 255' : k % 3 === 1 ? rgb : accentRgb
      ctx.fillStyle = `rgba(${col}, ${Math.min(1, (0.35 + v * 0.5 + bass * 0.4) * (0.4 + z3 * 0.6))})`
      ctx.beginPath()
      ctx.ellipse(x, y, s * (0.6 + z3 * 0.4), s, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
    // the string and the ball, tiled with facets that sparkle
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(bx, 0)
    ctx.lineTo(bx, by - br)
    ctx.stroke()
    const rows = 9
    for (let r = 0; r < rows; r++) {
      const lat0 = -Math.PI / 2 + (r / rows) * Math.PI
      const lat1 = -Math.PI / 2 + ((r + 1) / rows) * Math.PI
      const cols = Math.max(4, Math.round(Math.cos((lat0 + lat1) / 2) * 16))
      for (let c = 0; c < cols; c++) {
        const lon0 = (c / cols) * Math.PI * 2 + spin
        const lon1 = ((c + 1) / cols) * Math.PI * 2 + spin
        if (Math.cos((lon0 + lon1) / 2) < 0) continue // back side
        const x0 = bx + Math.sin(lon0) * Math.cos((lat0 + lat1) / 2) * br
        const x1 = bx + Math.sin(lon1) * Math.cos((lat0 + lat1) / 2) * br
        const y0 = by + Math.sin(lat0) * br
        const y1 = by + Math.sin(lat1) * br
        const sparkle = Math.sin(time * 6 + r * 3 + c * 7) > 0.85 - bass * 0.3
        const shade = 90 + Math.cos((lon0 + lon1) / 2) * 120
        ctx.fillStyle = sparkle ? 'rgba(255, 255, 255, 1)' : `rgba(${shade}, ${shade}, ${shade + 20}, 1)`
        ctx.fillRect(Math.min(x0, x1), y0, Math.max(0.5, Math.abs(x1 - x0) - 0.5), Math.max(0.5, y1 - y0 - 0.5))
      }
    }
    // glow around the ball
    const g = ctx.createRadialGradient(bx, by, br * 0.8, bx, by, br * 2)
    g.addColorStop(0, `rgba(255, 255, 255, ${0.1 + bass * 0.2})`)
    g.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(bx, by, br * 2, 0, Math.PI * 2)
    ctx.fill()
  },
})
