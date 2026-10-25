// Writes index.json from visualizers/*/meta.json + visualizer.js (with the sha256 the server checks).
// Run after adding or changing a visualizer: node tools/build-index.mjs
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'

const root = new URL('..', import.meta.url).pathname
const order = JSON.parse(readFileSync(root + 'order.json', 'utf8'))
const ids = readdirSync(root + 'visualizers').sort((a, b) => {
  const ia = order.indexOf(a), ib = order.indexOf(b)
  return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib) || a.localeCompare(b)
})
const visualizers = ids.map((id) => {
  const dir = `visualizers/${id}/`
  const meta = JSON.parse(readFileSync(root + dir + 'meta.json', 'utf8'))
  const code = readFileSync(root + dir + 'visualizer.js')
  const entry = {
    id,
    name: meta.name,
    author: meta.author || 'parrotify',
    version: meta.version || '1.0.0',
    description: meta.description || '',
    trails: !!meta.trails,
    entry: dir + 'visualizer.js',
    sha256: createHash('sha256').update(code).digest('hex'),
  }
  if (existsSync(root + dir + 'preview.png')) entry.preview = dir + 'preview.png'
  // files the visualizer needs (3D models …): in its own folder, or shared ones under assets/
  if (meta.assets?.length) {
    entry.assets = meta.assets.map((p) => {
      const path = p.startsWith('assets/') ? p : dir + p
      const b = readFileSync(root + path)
      return { path, sha256: createHash('sha256').update(b).digest('hex'), size: b.length }
    })
  }
  return entry
})
writeFileSync(root + 'index.json', JSON.stringify({ schema: 1, name: 'Parrotify Visualizers', visualizers }, null, 2) + '\n')
console.log(`index.json: ${visualizers.length} visualizers`)
