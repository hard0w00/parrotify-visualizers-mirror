// Hologram: the bust as a cloud of glowing points with scanlines. It turns with the bass, the
// camera cuts every few beats, and on a beat horizontal slices tear sideways like a broken
// transmission. Model: assets/bust.glb, "Classical Healer Bust" by Sana Sato (Sketchfab,
// CC BY 4.0), simplified (needs Parrotify 0.0.9+; without it only the scanlines).

const VS = `
attribute vec3 aPos;
uniform mat4 uMvp; uniform float uGlitch; uniform float uTime; uniform float uSize; uniform float uSpan;
varying float vDepth; varying float vH;
float hash(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  vec3 p = aPos;
  // slices torn sideways on the beat
  float slice = floor(p.y / uSpan * 24.0 + floor(uTime * 12.0) * 7.0);
  p.x += (hash(slice) - 0.5) * uGlitch * uSpan * step(0.7, hash(slice + 3.1));
  gl_Position = uMvp * vec4(p, 1.0);
  vDepth = gl_Position.w;
  vH = aPos.y / uSpan;
  gl_PointSize = uSize / max(gl_Position.w, 0.1);
}`

const FS = `
precision highp float;
varying float vDepth; varying float vH;
uniform vec3 uTint; uniform float uFlash; uniform float uTime; uniform vec2 uRes;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c);
  if (d > 0.25) discard;
  float scan = 0.55 + 0.45 * sin(gl_FragCoord.y * 1.4 + uTime * 6.0);
  float band = smoothstep(0.02, 0.0, abs(fract(vH * 0.5 - uTime * 0.15) - 0.5));
  vec3 col = uTint * (0.35 + 0.65 * scan) * (0.6 + uFlash) + vec3(0.7, 0.9, 1.0) * band * 0.8;
  gl_FragColor = vec4(col * (1.0 - d * 3.0), 0.55);
}`

const BG_VS = `attribute vec2 p; varying vec2 uv; void main() { uv = p; gl_Position = vec4(p, 0.999, 1.0); }`
const BG_FS = `
precision mediump float;
varying vec2 uv; uniform vec3 uTint; uniform float uTime;
void main() {
  float scan = 0.5 + 0.5 * sin((uv.y + uTime * 0.05) * 400.0);
  vec3 col = uTint * 0.025 * scan + vec3(0.0, 0.01, 0.015);
  col *= 1.0 - 0.6 * dot(uv, uv) * 0.5;
  gl_FragColor = vec4(col, 1.0);
}`

let gl = null
let prog = null
let bg = null
let bgBuf = null
let pts = null // { buf, count }
let span = 1
let center = [0, 0, 0]
let loading = false
let shot = 1
let shotAt = 0
let lastBeats = 0
let flash = 0
let glitch = 0
let angle = 0
let last = 0

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const persp = (fov, asp, n, f) => { const t = 1 / Math.tan(fov / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, (2 * f * n) / (n - f), 0] }
const lookAt = (eye, at) => {
  const z = norm(sub(eye, at)), x = norm(cross([0, 1, 0], z)), y = cross(z, x)
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]
}
const mul = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let v = 0; for (let k = 0; k < 4; k++) v += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = v } return o }
const rotY = (a, c) => [Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, -c[0] * Math.cos(a) - c[2] * Math.sin(a), -c[1], c[0] * Math.sin(a) - c[2] * Math.cos(a), 1]
const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
const rgb = (s) => String(s || '120, 220, 255').split(',').map((v) => (Number(v) || 0) / 255)

function program(vs, fs) {
  const p = gl.createProgram()
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader')
    gl.attachShader(p, s)
  }
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link')
  return p
}

function upload(glb) {
  span = Math.max(glb.max[0] - glb.min[0], glb.max[1] - glb.min[1], glb.max[2] - glb.min[2]) || 1
  center = [0, 1, 2].map((i) => (glb.min[i] + glb.max[i]) / 2)
  // the vertices as points (every other one: a hologram is airy)
  const all = []
  for (const m of glb.meshes) for (let i = 0; i < m.position.length; i += 6) all.push(m.position[i], m.position[i + 1], m.position[i + 2])
  const data = new Float32Array(all)
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
  pts = { buf, count: data.length / 3 }
}

parrotify.register({
  webgl: true,
  maxPixelRatio: 1,
  color: '#62d8ff',
  init(context) {
    gl = context
    prog = program(VS, FS)
    bg = program(BG_VS, BG_FS)
    bgBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, bgBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    pts = null
    if (!loading && parrotify.loadGLB && parrotify.asset && parrotify.asset('bust.glb')) {
      loading = true
      parrotify.loadGLB('bust.glb').then((m) => { upload(m); loading = false }, () => { loading = false })
    }
  },
  draw(g, f) {
    const dt = Math.min(0.1, Math.max(0, f.time - (last || f.time)))
    last = f.time
    if (f.beats !== lastBeats) {
      lastBeats = f.beats
      flash = 1
      glitch = 0.25 + f.bass * 0.4
      if (f.beats % 4 === 0 && f.time - shotAt > 1.2) { shot++; shotAt = f.time }
    }
    if (f.time - shotAt > 7) { shot++; shotAt = f.time }
    flash *= Math.exp(-dt * 6)
    glitch *= Math.exp(-dt * 9)
    angle += (0.3 + f.bass * 1.4) * dt

    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    const tint = rgb(f.rgb)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.BLEND)
    gl.useProgram(bg)
    gl.bindBuffer(gl.ARRAY_BUFFER, bgBuf)
    const bp = gl.getAttribLocation(bg, 'p')
    gl.enableVertexAttribArray(bp)
    gl.vertexAttribPointer(bp, 2, gl.FLOAT, false, 0, 0)
    gl.uniform3fv(gl.getUniformLocation(bg, 'uTint'), tint)
    gl.uniform1f(gl.getUniformLocation(bg, 'uTime'), f.time % 100)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.disableVertexAttribArray(bp)
    if (!pts) return

    // the shot: from a side, close or wide, drifting
    const t = f.time - shotAt
    const kind = Math.floor(rnd(shot) * 3)
    const side = (rnd(shot + 0.4) - 0.5) * 2.6
    const dist = span * ([1.0, 1.7, 1.35][kind] - t * 0.02)
    const look = [center[0], center[1] + span * [0.2, 0.0, 0.1][kind], center[2]]
    const eye = [look[0] + Math.sin(side) * dist, look[1] + span * [0.12, 0.0, -0.3][kind], look[2] + Math.cos(side) * dist]
    const right = norm(cross(sub(look, eye), [0, 1, 0]))
    const off = (rnd(shot + 1.3) < 0.5 ? -1 : 1) * span * 0.3
    for (let i = 0; i < 3; i++) { look[i] -= right[i] * off; eye[i] -= right[i] * off }
    const mvp = mul(persp(0.7, f.pw / Math.max(1, f.ph), span * 0.05, span * 10), mul(lookAt(eye, look), rotY(angle, center)))

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE) // light adds up
    gl.useProgram(prog)
    const U = (n) => gl.getUniformLocation(prog, n)
    gl.uniformMatrix4fv(U('uMvp'), false, mvp)
    gl.uniform1f(U('uGlitch'), glitch)
    gl.uniform1f(U('uTime'), f.time % 100)
    gl.uniform1f(U('uSize'), (2.2 + f.energy * 2) * span * (f.ph / 600))
    gl.uniform1f(U('uSpan'), span)
    gl.uniform3fv(U('uTint'), tint)
    gl.uniform1f(U('uFlash'), f.playing ? flash : 0)
    gl.uniform2f(U('uRes'), f.pw, f.ph)
    const a = gl.getAttribLocation(prog, 'aPos')
    gl.bindBuffer(gl.ARRAY_BUFFER, pts.buf)
    gl.enableVertexAttribArray(a)
    gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.POINTS, 0, pts.count)
    gl.disableVertexAttribArray(a)
    gl.disable(gl.BLEND)
  },
})
