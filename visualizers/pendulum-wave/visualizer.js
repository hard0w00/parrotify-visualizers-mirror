// Pendulum wave: a row of pendulums of slowly differing lengths that drift in and out of phase,
// drawing snakes and braids; each pendulum swings wider the louder its band is.
piratify.register({
  trails: true,
  draw(ctx, f) {
    const { levels, w, h, rgb, soft, time } = f
    const count = 24
    const top = h * 0.06
    ctx.strokeStyle = `rgba(${rgb}, 0.25)`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, top)
    ctx.lineTo(w, top)
    ctx.stroke()
    for (let i = 0; i < count; i++) {
      const v = levels[Math.floor((i / count) * levels.length)]
      const x0 = ((i + 0.5) * w) / count
      const len = (h - top) * (0.5 + (i / count) * 0.42)
      const swingsPerMinute = 51 + i // the classic pendulum wave: all in phase again after 60 s
      const a = (0.2 + v * 0.55) * Math.sin((time * Math.PI * 2 * swingsPerMinute) / 60)
      const bx = x0 + Math.sin(a) * len * 0.6
      const by = top + Math.cos(a) * len
      ctx.strokeStyle = `rgba(${rgb}, ${0.15 + v * 0.3})`
      ctx.beginPath()
      ctx.moveTo(x0, top)
      ctx.lineTo(bx, by)
      ctx.stroke()
      ctx.fillStyle = v > 0.6 ? soft : `rgba(${rgb}, ${0.5 + v * 0.5})`
      ctx.beginPath()
      ctx.arc(bx, by, Math.max(0.5, (w / count) * (0.18 + v * 0.22)), 0, Math.PI * 2)
      ctx.fill()
    }
  },
})
