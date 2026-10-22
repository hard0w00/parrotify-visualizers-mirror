// Pixel Fire: the old demoscene fire effect. The bottom row is fed by the spectrum, heat rises
// and cools on a coarse grid, the palette goes from the colour through orange to white.
const GW = 96
const GH = 54
const heat = new Float32Array(GW * GH)
let seed = 1

piratify.register({
  trails: false,
  color: '#ff4d1a',
  draw(ctx, f) {
    const { levels, w, h, rgb, bass } = f
    // feed the bottom row
    for (let x = 0; x < GW; x++) {
      seed = (seed * 16807) % 2147483647
      const v = levels[Math.floor(Math.abs(x / (GW - 1) - 0.5) * 2 * 63)]
      heat[(GH - 1) * GW + x] = Math.min(1, v * 1.2 + bass * 0.3) * (0.6 + (seed % 100) / 250)
    }
    // rise: every cell takes the average of the cells below it, minus some cooling
    for (let y = 0; y < GH - 1; y++) {
      for (let x = 0; x < GW; x++) {
        const below = (y + 1) * GW
        const l = heat[below + ((x + GW - 1) % GW)]
        const c = heat[below + x]
        const r = heat[below + ((x + 1) % GW)]
        const b2 = y + 2 < GH ? heat[(y + 2) * GW + x] : c
        heat[y * GW + x] = Math.max(0, (l + c + r + b2) / 4.04 - 0.012)
      }
    }
    const cw = w / GW
    const ch = h / GH
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        const t = heat[y * GW + x]
        if (t < 0.05) continue
        let col
        if (t < 0.3) col = `rgba(${rgb}, ${t * 3})`
        else if (t < 0.6) col = `rgba(255, ${Math.round(80 + (t - 0.3) * 400)}, 20, 1)`
        else col = `rgba(255, 220, ${Math.round((t - 0.6) * 600)}, 1)`
        ctx.fillStyle = col
        ctx.fillRect(x * cw, y * ch, cw + 0.5, ch + 0.5)
      }
    }
  },
})
