// Peak Meter: a segmented LED spectrum analyser like on a stereo rack: green, yellow and red
// segments, with peak caps that hold for a moment and then fall.
const BANDS = 24
const peaks = new Float32Array(BANDS)
const holds = new Float32Array(BANDS)
let lastTime = 0

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const { levels, w, h, time } = f
    const dt = lastTime ? Math.min(0.1, Math.max(0, time - lastTime)) : 1 / 60
    lastTime = time
    const segs = 20
    const pad = Math.max(4, w * 0.03)
    const bw = (w - pad * 2) / BANDS
    const sh = (h - pad * 2) / segs
    for (let b = 0; b < BANDS; b++) {
      // average the bands that fall into this column
      let v = 0
      const from = Math.floor((b / BANDS) * 64)
      const to = Math.max(from + 1, Math.floor(((b + 1) / BANDS) * 64))
      for (let i = from; i < to; i++) v += levels[i]
      v /= to - from
      if (v >= peaks[b]) { peaks[b] = v; holds[b] = 0.6 } else if ((holds[b] -= dt) < 0) peaks[b] = Math.max(0, peaks[b] - dt * 0.6)
      const lit = Math.round(v * segs)
      for (let s = 0; s < segs; s++) {
        const p = s / segs
        const hue = p < 0.6 ? 120 : p < 0.85 ? 55 : 0
        ctx.fillStyle = s < lit ? `hsla(${hue}, 95%, 50%, 0.95)` : `hsla(${hue}, 60%, 25%, 0.25)`
        ctx.fillRect(pad + b * bw + 1, h - pad - (s + 1) * sh + 1, bw - 2, sh - 2)
      }
      const ps = Math.min(segs - 1, Math.floor(peaks[b] * segs))
      if (peaks[b] > 0.02) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
        ctx.fillRect(pad + b * bw + 1, h - pad - (ps + 1) * sh + 1, bw - 2, sh - 2)
      }
    }
  },
})
