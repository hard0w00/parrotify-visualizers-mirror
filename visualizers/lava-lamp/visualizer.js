// Lava Lamp: warm blobs rise and sink and melt into each other (metaballs on a coarse grid).
// The bass heats the lamp: blobs swell and climb faster; each blob listens to its own band.
const BLOBS = 7
let lastTime = 0
let heat = 0

piratify.register({
  trails: false,
  color: '#ff5e3a',
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, time, bass } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    heat += dt * (0.25 + bass * 0.8)
    const blobs = []
    for (let b = 0; b < BLOBS; b++) {
      const v = levels[b * 9]
      blobs.push({
        x: w * (0.5 + Math.sin(heat * 0.7 + b * 2.1) * 0.3),
        y: h * (0.5 + Math.sin(heat * (0.4 + b * 0.07) + b * 1.3) * 0.42),
        r: Math.min(w, h) * (0.08 + v * 0.07 + bass * 0.02),
      })
    }
    // glass glow
    const bg = ctx.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, `rgba(${accentRgb}, 0.18)`)
    bg.addColorStop(1, `rgba(${rgb}, 0.3)`)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    const step = Math.max(4, Math.round(Math.min(w, h) / 56))
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        let field = 0
        for (const b of blobs) {
          const dx = x - b.x
          const dy = y - b.y
          field += (b.r * b.r) / (dx * dx + dy * dy + 1)
        }
        if (field < 0.6) continue
        // inside: hot core yellow, edges in the colour
        const t = Math.min(1, (field - 0.6) * 0.8)
        ctx.fillStyle = t > 0.5 ? `rgba(255, ${170 + t * 70}, 80, 0.95)` : `rgba(${rgb}, ${0.5 + t})`
        ctx.fillRect(x, y, step, step)
      }
    }
  },
})
