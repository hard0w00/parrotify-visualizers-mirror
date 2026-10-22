// VHS: spectrum bars as if played from an old tape: red/cyan colour fringes that spread with
// the bass, scanlines, a rolling tracking band and noise when the beat hits. "PLAY ▶" included.
let lastBass = 0
let glitch = 0
let lastTime = 0

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, time, bass } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    if (bass > 0.6 && bass - lastBass > 0.1) glitch = 1
    lastBass = bass
    glitch = Math.max(0, glitch - dt * 3)
    const n = 32
    const bw = w / n
    const base = h * 0.85
    const split = 2 + bass * 6 + glitch * 10
    // three passes: red shifted left, cyan shifted right, then the colour itself on top
    const passes = [[-split, '255, 40, 80', 0.5], [split, '40, 230, 255', 0.5], [0, rgb, 0.9]]
    ctx.globalCompositeOperation = 'lighter'
    for (const [dx, col, a] of passes) {
      ctx.fillStyle = `rgba(${col}, ${a})`
      for (let i = 0; i < n; i++) {
        const v = levels[i * 2]
        const bh = v * h * 0.7
        // during a glitch some rows tear sideways
        const tear = glitch > 0 && (i * 13 + Math.floor(time * 20)) % 7 === 0 ? glitch * bw * 1.5 : 0
        ctx.fillRect(i * bw + 2 + dx + tear, base - bh, bw - 4, bh)
      }
    }
    ctx.globalCompositeOperation = 'source-over'
    // scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1)
    // tracking band rolling down, with noise
    const by = ((time * 0.15) % 1.3 - 0.15) * h
    const bandH = h * (0.04 + glitch * 0.08)
    ctx.fillStyle = `rgba(255, 255, 255, ${0.04 + glitch * 0.12})`
    ctx.fillRect(0, by, w, bandH)
    let seed = Math.floor(time * 30)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
    for (let k = 0; k < 40 + glitch * 160; k++) {
      seed = (seed * 16807 + 11) % 2147483647
      const x = (seed % 1000) / 1000 * w
      const y = by + ((seed >> 10) % 1000) / 1000 * bandH
      ctx.fillRect(x, y, 2 + (seed % 7), 1)
    }
    // on-screen display
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.font = `${Math.max(8, Math.round(h * 0.06))}px monospace`
    ctx.fillText('PLAY ▶', w * 0.05, h * 0.12)
    const secs = Math.floor(time)
    const clock = `${String(Math.floor(secs / 3600) % 24).padStart(2, '0')}:${String(Math.floor(secs / 60) % 60).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
    ctx.fillText(clock, w * 0.05, h * 0.95 - 0)
  },
})
