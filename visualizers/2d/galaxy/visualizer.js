// Galaxy: a spiral galaxy turning slowly, tilted towards you. Stars sit on two arms and sparkle
// with their bands, the core glows with the bass, the rotation speeds up with the energy.
const N = 900
const stars = []
let spin = 0
let lastTime = 0

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, rgb, accentRgb, time, bass, energy } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    spin += dt * (0.08 + energy * 0.4)
    if (stars.length === 0) {
      let s = 4242
      const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
      for (let i = 0; i < N; i++) {
        const d = Math.pow(rnd(), 0.7) // more stars near the core
        const arm = i % 2
        const a = d * 7 + arm * Math.PI + (rnd() - 0.5) * (0.9 - d * 0.5)
        stars.push({ d, a, band: Math.floor(d * 63), size: rnd() })
      }
    }
    const cx = w / 2
    const cy = h / 2
    const R = Math.max(w, h) * 0.45
    const tilt = 0.45
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * (0.25 + bass * 0.15))
    core.addColorStop(0, 'rgba(255, 245, 220, 0.9)')
    core.addColorStop(0.4, `rgba(${accentRgb}, 0.35)`)
    core.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = core
    ctx.fillRect(0, 0, w, h)
    for (const st of stars) {
      const a = st.a + spin / (0.3 + st.d) // inner stars turn faster
      const r = st.d * R
      const x = cx + Math.cos(a) * r
      const y = cy + Math.sin(a) * r * tilt
      const v = levels[st.band]
      const tw = 0.4 + v * 0.6 + Math.sin(time * 3 + st.size * 50) * 0.1
      ctx.fillStyle = st.size > 0.85 ? `rgba(255, 255, 255, ${tw})` : `rgba(${st.d < 0.4 ? accentRgb : rgb}, ${tw * 0.8})`
      const s = 0.8 + st.size * 1.5 + v * 1.5
      ctx.fillRect(x - s / 2, y - s / 2, s, s)
    }
  },
})
