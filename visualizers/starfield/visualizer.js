// Starfield: Warp flight: stars stream out of the centre, the bass stretches them into streaks.
// One of piratify's original visualizers (moved here from the built-in presets).
piratify.register({
  trails: true,
  draw(ctx, f) {
    const mode = 'starfield'
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
    // warp flight: stars stream out of the centre, the bass stretches them into streaks
    const cx = w / 2
    const cy = h / 2
    const reach = Math.hypot(cx, cy)
    for (let i = 0; i < 140; i++) {
      const ang = (i * 137.508 * Math.PI) / 180 // golden angle: even spread without randomness
      const z = (i / 140 + now * (0.12 + i % 5 * 0.015)) % 1 // 0 = far, 1 = passing by
      const d = z * z * reach
      const len = 2 + bass * 30 * z
      const band = levels[i % n]
      ctx.strokeStyle = i % 4 === 0 ? `rgba(255, 255, 255, ${0.2 + z * 0.7})` : `rgba(${rgb}, ${0.25 + z * 0.6 + band * 0.2})`
      ctx.lineWidth = 0.6 + z * 2.2
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d)
      ctx.lineTo(cx + Math.cos(ang) * (d + len), cy + Math.sin(ang) * (d + len))
      ctx.stroke()
    }
  },
})
