// Neon Tunnel: square neon frames rushing towards you down a tunnel that twists with the
// mids. Each frame takes the colour of its band, the bass kicks the speed.
let travel = 0
let lastTime = 0

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, time, bass, mid } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    travel += dt * (0.5 + bass * 3)
    const frames = 18
    const size = Math.max(w, h) * 0.9
    ctx.lineJoin = 'round'
    for (let k = frames - 1; k >= 0; k--) {
      const z = 0.2 + ((k - (travel % 1) + frames) % frames) // far = large z
      const s = size / z
      const band = Math.min(63, Math.floor((k / frames) * 64))
      const v = levels[band]
      // the far end of the tunnel bends away on a slow circle
      const bend = 1 - 1 / (1 + z * 0.15)
      const cx = w / 2 + Math.sin(time * 0.7) * w * 0.25 * bend
      const cy = h / 2 + Math.cos(time * 0.5) * h * 0.2 * bend
      const rot = Math.sin(time * 0.3) * 0.6 * bend + mid * 0.3 * bend
      const alpha = Math.min(1, 2.5 / z)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rot)
      ctx.strokeStyle = k % 2 ? `rgba(${rgb}, ${alpha})` : `rgba(${accentRgb}, ${alpha})`
      ctx.shadowColor = ctx.strokeStyle
      ctx.shadowBlur = 6 + v * 20
      ctx.lineWidth = Math.max(1, (2 + v * 6) / Math.sqrt(z))
      ctx.strokeRect(-s / 2, -s * 0.3, s, s * 0.6)
      ctx.restore()
    }
  },
})
