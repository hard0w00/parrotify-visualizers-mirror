// Skyline: A night city whose windows light up with the music, under a pulsing moon.
// One of parrotify's original visualizers (moved here from the built-in presets).
parrotify.register({
  trails: false,
  draw(ctx, f) {
    const mode = 'skyline'
    const { levels, w, h, rgb, soft } = f
    const n = levels.length
    const pad = 10
    const mid = h * 0.5
    const maxUp = mid - pad
    const maxDown = h - mid - pad
    const now = f.time
    const bass = f.bass
    const midE = f.mid
    const high = f.high
    const energy = f.energy
    const ampSafe = (i) => levels[i % n] || 0.1
    // night city: building heights follow the bands, windows light up with them, the moon pulses
    const ground = h - pad
    const moonR = Math.min(w, h) * (0.06 + bass * 0.03)
    ctx.fillStyle = soft
    ctx.globalAlpha = 0.5 + bass * 0.4
    ctx.beginPath()
    ctx.arc(w * 0.78, h * 0.24, moonR, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    const count = 32
    const bw = w / count
    for (let i = 0; i < count; i++) {
      const amp = levels[Math.floor((i / count) * n)]
      const base = 0.18 + ((i * 7919) % 13) / 40 // fixed silhouette, the music adds on top
      const bh = Math.min(ground - pad, (base + amp * 0.45) * (h - 2 * pad))
      const x = i * bw
      ctx.fillStyle = `rgba(${rgb}, ${0.18 + amp * 0.25})`
      ctx.fillRect(x + 1, ground - bh, bw - 2, bh)
      const rows = Math.floor(bh / 9)
      for (let r = 1; r < rows; r++) {
        for (let c = 0; c < 2; c++) {
          const lit = ((i * 31 + r * 17 + c * 7) % 10) / 10 < amp * 1.2
          if (!lit) continue
          ctx.fillStyle = `rgba(255, 236, 170, ${0.4 + amp * 0.5})`
          ctx.fillRect(x + 3 + c * (bw / 2 - 1), ground - bh + r * 9, Math.max(1, bw / 2 - 5), 4)
        }
      }
    }
  },
})
