# parrotify-visualizers

Visualizers for [Parrotify](https://git.search-fire.net/parrotify)'s player (called Piratify up to
0.0.4). A Parrotify server
syncs this repo (Admin → Visualizer repos); every user then picks the visualizers they want and
which of them play in "random".

## Layout

```
index.json                        generated: list of all visualizers (node tools/build-index.mjs)
order.json                        order in the store
visualizers/<id>/visualizer.js    the code
visualizers/<id>/meta.json        name, author, version, description, trails
visualizers/<id>/preview.png      480×270 still (node tools/previews.mjs <id>)
```

`<id>`: lower case letters, digits and dashes, at most 40 characters.

## Writing a visualizer

A visualizer is plain JavaScript that calls `parrotify.register` once:

```js
parrotify.register({
  trails: false,        // true: the old frame fades out instead of being cleared (motion trails)
  color: '#ff6a00',     // optional: own default colour (else the user's choice, e.g. the UI complement)
  draw(ctx, f) {
    // ctx: CanvasRenderingContext2D, already scaled to CSS pixels, cleared (or faded) for you
    const barW = f.w / f.levels.length
    f.levels.forEach((v, i) => {
      ctx.fillStyle = `rgba(${f.rgb}, ${0.3 + v * 0.7})`
      ctx.fillRect(i * barW, f.h * (1 - v), barW - 1, f.h * v)
    })
  },
})
```

`parrotify.register` needs a server from 0.0.5 on; older (Piratify) servers only know
`piratify.register`, which newer servers still accept.

`draw` runs once per animation frame with `f`:

| field | meaning |
|---|---|
| `levels` | `Float32Array(64)`, 0..1, `levels[0]` bass … `levels[63]` treble |
| `w`, `h` | canvas size in CSS pixels |
| `time` | seconds (monotonic) |
| `bass`, `mid`, `high`, `energy` | averages of the levels, 0..1 |
| `rgb` | colour to draw in as `"r, g, b"` (use `rgba(${f.rgb}, a)`) |
| `soft` | lighter variant of that colour (CSS colour) |
| `accentRgb` | the UI accent as `"r, g, b"` |
| `playing` | whether music plays (levels fall to 0 when paused) |

Keep it stateless where you can (derive motion from `time` and `levels`); module-level
variables are fine for state that has to persist between frames.

### What a visualizer can and cannot do

It runs in a sandbox: an `<iframe sandbox="allow-scripts">` page with a strict
Content-Security-Policy. It has a canvas and nothing else — no network (`fetch`, images,
WebSocket), no storage, no access to the player page or the user's login. Errors in `draw`
are caught; after 30 failing frames in a row the player falls back to another visualizer.

## Checks

```bash
npm install
node tools/build-index.mjs      # after every change (index.json pins the sha256 of each file)
node --test tools/test.mjs      # every visualizer registers and draws with finite numbers
npx playwright install chromium && node tools/previews.mjs <id>
```

A Parrotify server refuses a visualizer whose file does not match the `sha256` in `index.json`.

## Your own repo

Fork or copy this layout anywhere (Forgejo/Gitea, GitHub or any web server serving
`index.json`) and add its URL under Admin → Visualizer repos.
