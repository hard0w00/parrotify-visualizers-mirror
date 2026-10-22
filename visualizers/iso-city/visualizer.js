// Iso city: an isometric block of towers. Every tower is a band; it grows and shrinks with
// it, the roofs light up on the loud ones.
parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, accentRgb, time } = f
    const N = 8
    const tile = Math.max(1, Math.min(w / (N * 2.2), h / (N * 1.6)))
    const ox = w / 2
    const oy = h * 0.22
    // back to front, so near towers cover far ones
    for (let s = 0; s < N * 2 - 1; s++) {
      for (let gx = 0; gx < N; gx++) {
        const gy = s - gx
        if (gy < 0 || gy >= N) continue
        const band = (gx * N + gy) % levels.length
        const v = levels[band]
        const sway = 0.5 + 0.5 * Math.sin(time * 0.7 + gx * 0.9 + gy * 1.3)
        const hgt = tile * (0.4 + v * 4.5 + sway * 0.3)
        const x = ox + (gx - gy) * tile
        const y = oy + (gx + gy) * tile * 0.5
        // left face
        ctx.fillStyle = `rgba(${rgb}, ${0.25 + v * 0.3})`
        ctx.beginPath()
        ctx.moveTo(x - tile, y + tile * 0.5)
        ctx.lineTo(x, y + tile)
        ctx.lineTo(x, y + tile - hgt)
        ctx.lineTo(x - tile, y + tile * 0.5 - hgt)
        ctx.closePath()
        ctx.fill()
        // right face
        ctx.fillStyle = `rgba(${rgb}, ${0.12 + v * 0.2})`
        ctx.beginPath()
        ctx.moveTo(x + tile, y + tile * 0.5)
        ctx.lineTo(x, y + tile)
        ctx.lineTo(x, y + tile - hgt)
        ctx.lineTo(x + tile, y + tile * 0.5 - hgt)
        ctx.closePath()
        ctx.fill()
        // roof
        ctx.fillStyle = v > 0.6 ? soft : `rgba(${v > 0.35 ? accentRgb : rgb}, ${0.35 + v * 0.5})`
        ctx.beginPath()
        ctx.moveTo(x, y - hgt)
        ctx.lineTo(x + tile, y + tile * 0.5 - hgt)
        ctx.lineTo(x, y + tile - hgt)
        ctx.lineTo(x - tile, y + tile * 0.5 - hgt)
        ctx.closePath()
        ctx.fill()
      }
    }
  },
})
