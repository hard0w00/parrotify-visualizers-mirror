// Dunes: layers of desert dunes in the evening, the far ones drift slowly, the near ones are
// shaped by the bass. Each layer listens to another range of the spectrum.
piratify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, time } = f
    const layers = 6
    ctx.fillStyle = soft
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.arc(w * 0.25, h * 0.3, Math.max(0.5, Math.min(w, h) * 0.09), 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    for (let l = 0; l < layers; l++) {
      // back layers: highs, front layers: bass
      const from = Math.floor(((layers - 1 - l) / layers) * levels.length)
      let v = 0
      for (let k = 0; k < 10; k++) v += levels[Math.min(levels.length - 1, from + k)]
      v /= 10
      const base = h * (0.42 + l * 0.1)
      const amp = h * (0.03 + v * 0.12) * (1 + l * 0.2)
      const speed = 0.05 + l * 0.06
      ctx.fillStyle = `rgba(${rgb}, ${0.12 + l * 0.13})`
      ctx.beginPath()
      ctx.moveTo(0, h)
      for (let x = 0; x <= w + 8; x += 8) {
        const t = x / Math.max(1, w)
        const y = base
          - Math.sin(t * (3 + l) + time * speed + l * 1.7) * amp
          - Math.sin(t * (7 + l * 2) - time * speed * 1.3 + l) * amp * 0.35
        ctx.lineTo(x, y)
      }
      ctx.lineTo(w, h)
      ctx.closePath()
      ctx.fill()
    }
  },
})
