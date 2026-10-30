// Rebuilds the README's animated gallery between its markers from index.json.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const root = new URL('..', import.meta.url).pathname
const index = JSON.parse(readFileSync(root + 'index.json', 'utf8'))
const begin = '<!-- GALLERY:BEGIN -->'
const end = '<!-- GALLERY:END -->'
const readme = readFileSync(root + 'README.md', 'utf8')
const start = readme.indexOf(begin)
const stop = readme.indexOf(end)
if (start < 0 || stop < 0) throw new Error('README gallery markers missing')

function table(items) {
  const lines = ['| | | |', '|---|---|---|']
  for (let i = 0; i < items.length; i += 3) {
    const cells = items.slice(i, i + 3).map((v) => {
      const dir = v.entry.slice(0, -'visualizer.js'.length)
      const image = dir + (existsSync(root + dir + 'preview.gif') ? 'preview.gif' : 'preview.png')
      return `[![${v.name}](${image})](${image})<br>[${v.name}](${dir}visualizer.js)`
    })
    while (cells.length < 3) cells.push('')
    lines.push('| ' + cells.join(' | ') + ' |')
  }
  return lines.join('\n')
}

const gallery = [
  begin,
  '',
  `All ${index.visualizers.length} presets, animated with a synthetic spectrum. Click an image for the full-size GIF.`,
  '',
  '### 2D',
  '',
  table(index.visualizers.filter((v) => v.category === '2d')),
  '',
  '### 3D / WebGL',
  '',
  table(index.visualizers.filter((v) => v.category === '3d')),
  '',
  end,
].join('\n')
writeFileSync(root + 'README.md', readme.slice(0, start) + gallery + readme.slice(stop + end.length))
console.log(`README gallery: ${index.visualizers.length} presets`)
