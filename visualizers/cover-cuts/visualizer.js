// Cover Cuts: the cover of the track as footage. A slow drift over the picture, a hard cut to a
// new framing on every second beat, a flash on each beat, the highs split it into its colours
// and the mids shift strips of it sideways. Without a cover a colour field takes its place.

let shot = 0
let shotAt = 0
let lastBeats = 0
let flash = 0
let lastTime = 0
let field = null // stand-in picture when there is no cover

const rnd = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function standIn(rgb) {
  if (field && field.rgb === rgb) return field.canvas
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(256, 256) : null
  if (!c) return null
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(90, 90, 10, 128, 128, 200)
  grad.addColorStop(0, `rgba(${rgb}, 1)`)
  grad.addColorStop(1, 'rgba(10, 7, 18, 1)')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  field = { rgb, canvas: c }
  return c
}

parrotify.register({
  trails: false,
  draw(ctx, f) {
    const dt = Math.min(0.1, Math.max(0, f.time - (lastTime || f.time)))
    lastTime = f.time
    if (f.beats !== lastBeats) {
      lastBeats = f.beats
      flash = 1
      if (f.beats % 2 === 0 && f.time - shotAt > 0.6) {
        shot++
        shotAt = f.time
      }
    }
    if (f.time - shotAt > 6) {
      shot++
      shotAt = f.time
    }
    flash *= Math.exp(-dt * 9)
    const img = f.cover || standIn(f.rgb)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, f.w, f.h)
    if (!img || f.w < 8 || f.h < 8) return

    // the framing of this shot: zoom, centre and tilt; it drifts slowly until the next cut
    const iw = img.width || 256
    const ih = img.height || 256
    const t = f.time - shotAt
    const zoom = 1.05 + rnd(shot) * 1.0 + t * 0.03 + f.bass * 0.06
    const cx = 0.25 + rnd(shot + 0.3) * 0.5 + Math.sin(t * 0.3) * 0.02
    const cy = 0.25 + rnd(shot + 0.7) * 0.5 + Math.cos(t * 0.25) * 0.02
    const tilt = (rnd(shot + 0.9) - 0.5) * 0.25
    const scale = (Math.max(f.w / iw, f.h / ih)) * zoom

    const drawLayer = (dx, alpha, op) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.globalCompositeOperation = op
      ctx.translate(f.w / 2 + dx, f.h / 2)
      ctx.rotate(tilt)
      ctx.scale(scale, scale)
      ctx.drawImage(img, -cx * iw, -cy * ih)
      ctx.restore()
    }
    drawLayer(0, 1, 'source-over')
    // colour split with the highs: the picture once more, shifted, lighter
    const split = f.high * 18 + flash * 8
    if (split > 3) {
      drawLayer(split, 0.18, 'lighter')
      drawLayer(-split, 0.12, 'lighter')
    }
    // the mids shift a few strips sideways
    const strips = Math.floor(f.mid * 6)
    for (let i = 0; i < strips; i++) {
      const y = rnd(shot * 13 + i + Math.floor(f.time * 8)) * f.h
      const hgt = 4 + rnd(i + shot) * 26
      const off = (rnd(i * 7 + Math.floor(f.time * 12)) - 0.5) * 80 * f.mid
      ctx.drawImage(ctx.canvas, 0, y * (ctx.canvas.width / f.w), ctx.canvas.width, hgt * (ctx.canvas.width / f.w), off, y, f.w, hgt)
    }
    // darkness around, the flash and a tint of the visualizer colour
    const v = ctx.createRadialGradient(f.w / 2, f.h / 2, Math.min(f.w, f.h) * 0.2, f.w / 2, f.h / 2, Math.max(f.w, f.h) * 0.75)
    v.addColorStop(0, 'rgba(0, 0, 0, 0)')
    v.addColorStop(1, `rgba(0, 0, 0, ${0.9 - flash * 0.3})`)
    ctx.fillStyle = v
    ctx.fillRect(0, 0, f.w, f.h)
    // the colour as a light on the picture, not a veil over the black
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = `rgba(${f.rgb}, ${0.25 + f.energy * 0.2})`
    ctx.fillRect(0, 0, f.w, f.h)
    ctx.restore()
    if (flash > 0.05) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.16})`
      ctx.fillRect(0, 0, f.w, f.h)
      ctx.restore()
    }
  },
})
