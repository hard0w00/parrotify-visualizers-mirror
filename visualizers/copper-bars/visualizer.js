// Copper Bars: Amiga-style raster bars swinging up and down on sine waves. Each bar listens to
// a part of the spectrum and gets thicker and brighter with it; a sine scroller wobbles below.
piratify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, time, bass, energy } = f
    const bars = 8
    const hues = [0, 30, 55, 120, 180, 210, 270, 320]
    // draw back to front by their depth (cos of the phase), like the real thing
    const order = []
    for (let b = 0; b < bars; b++) {
      const phase = time * (1.2 + energy) + b * 0.55
      order.push({ b, y: Math.sin(phase), z: Math.cos(phase) })
    }
    order.sort((a, c) => a.z - c.z)
    for (const { b, y, z } of order) {
      const v = levels[b * 8]
      const bh = h * (0.05 + v * 0.06) * (0.8 + z * 0.2)
      const cy = h * 0.42 + y * h * (0.28 + bass * 0.06)
      const g = ctx.createLinearGradient(0, cy - bh / 2, 0, cy + bh / 2)
      const light = 40 + v * 30
      g.addColorStop(0, `hsla(${hues[b]}, 90%, 15%, 1)`)
      g.addColorStop(0.5, `hsla(${hues[b]}, 95%, ${light + 25}%, 1)`)
      g.addColorStop(1, `hsla(${hues[b]}, 90%, 15%, 1)`)
      ctx.fillStyle = g
      ctx.fillRect(0, cy - bh / 2, w, bh)
    }
    // sine scroller
    const text = '  PARROTIFY  *  GREETINGS TO ALL MUSIC LOVERS  *  '
    const size = Math.max(8, Math.round(h * 0.09))
    ctx.font = `bold ${size}px monospace`
    const cw = size * 0.62
    const total = text.length * cw
    const off = (time * w * 0.15) % total
    for (let i = 0; i < text.length * 2; i++) {
      const x = i * cw - off
      if (x < -cw || x > w) continue
      const v = levels[(i * 5) % 64]
      const y = h * 0.88 + Math.sin(time * 3 + x * 0.02) * h * 0.04 - v * h * 0.03
      ctx.fillStyle = `hsl(${(x * 0.5 + time * 60) % 360}, 90%, ${60 + v * 25}%)`
      ctx.fillText(text[i % text.length], x, y)
    }
  },
})
