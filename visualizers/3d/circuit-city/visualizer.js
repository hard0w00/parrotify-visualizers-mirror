const VS = `
attribute vec3 aPos; attribute vec3 aNor; attribute vec4 aPart;
uniform mat4 uMvp; uniform float uEnergy; uniform float uBass;
varying vec3 vLocal; varying vec3 vNor; varying vec3 vWorld; varying float vSeed;
void main() {
  float h = aPart.z * (0.92 + uEnergy * 0.22 + uBass * 0.08);
  vec3 p = vec3(aPart.x * 2.15 + aPos.x, aPos.y * h, aPart.y * 2.15 + aPos.z);
  vLocal = vec3(aPos.x, aPos.y, aPos.z); vNor = aNor; vWorld = p; vSeed = aPart.w;
  gl_Position = uMvp * vec4(p, 1.0);
}`

const FS = `
precision highp float;
varying vec3 vLocal; varying vec3 vNor; varying vec3 vWorld; varying float vSeed;
uniform vec3 uTint; uniform vec3 uEye; uniform float uHigh; uniform float uFlash; uniform float uTime;
void main() {
  float top = step(0.5, vNor.y);
  vec2 edge2 = abs(vLocal.xz) / 0.46;
  float rim = smoothstep(0.82, 0.98, max(edge2.x, edge2.y)) * top;
  float pins = pow(0.5 + 0.5 * sin((vLocal.x + vLocal.z) * 42.0), 12.0) * (1.0 - top) * step(abs(vLocal.y - 0.16), 0.07);
  float trace = pow(0.5 + 0.5 * sin((vWorld.x + vWorld.z) * 5.0 - uTime * 4.0), 20.0);
  float light = max(dot(vNor, normalize(vec3(-0.5, 0.9, 0.4))), 0.0);
  vec3 col = vec3(0.008, 0.018, 0.021) + vec3(0.018, 0.045, 0.047) * light;
  col += uTint * (rim * (0.22 + uHigh * 0.65) + pins * 0.35 + trace * top * (0.025 + uFlash * 0.08));
  col += vec3(0.3, 0.8, 0.72) * top * step(0.92, fract(vSeed * 17.0)) * (0.04 + uFlash * 0.18);
  float fog = 1.0 - exp(-length(uEye - vWorld) * 0.022);
  gl_FragColor = vec4(mix(col, vec3(0.003, 0.009, 0.013), fog), 1.0);
}`

const BOARD_VS = `attribute vec2 aPos; uniform mat4 uMvp; varying vec2 vP;
void main() { vP = aPos; gl_Position = uMvp * vec4(aPos.x, -0.02, aPos.y, 1.0); }`
const BOARD_FS = `
precision highp float;
varying vec2 vP; uniform vec3 uTint; uniform float uTime; uniform float uBass; uniform float uFlash;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 p = vP / 2.15;
  vec2 id = floor(p + 0.5);
  vec2 q = fract(p + 0.5) - 0.5;
  float turn = step(0.5, hash(id));
  vec2 track = mix(vec2(abs(q.x), abs(q.y)), vec2(abs(q.y), abs(q.x)), turn);
  float wire = 1.0 - smoothstep(0.018, 0.035, min(track.x, track.y));
  float pad = 1.0 - smoothstep(0.10, 0.14, length(q));
  float via = (1.0 - smoothstep(0.035, 0.055, abs(length(q) - 0.085)));
  float phase = fract(hash(id + 4.0) + uTime * (0.16 + uBass * 0.18) - length(id) * 0.035);
  float packet = exp(-pow((phase - 0.5) * 12.0, 2.0));
  float bus = pow(0.5 + 0.5 * sin((p.x - p.y) * 3.0 - uTime * 2.0), 24.0);
  vec3 col = vec3(0.002, 0.011, 0.012);
  col += uTint * (wire * (0.045 + packet * 0.75 + bus * 0.09) + pad * 0.08 + via * (0.13 + uFlash * 0.3));
  col *= 1.0 - smoothstep(22.0, 58.0, length(vP));
  gl_FragColor = vec4(col, 1.0);
}`

let gl, parts, board, partBuf, boardBuf, count
let last = 0, flash = 0, lastBeats = 0
const rnd = (n) => { const x = Math.sin(n * 91.7 + 217.3) * 43758.5453; return x - Math.floor(x) }
const rgb = (s) => String(s || '30, 255, 180').split(',').map((v) => (Number(v) || 0) / 255)
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((v) => v / l) }
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const persp = (fov, asp, n, f) => { const t = 1 / Math.tan(fov / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0] }
const lookAt = (eye, at) => { const z = norm(sub(eye, at)), x = norm(cross([0, 1, 0], z)), y = cross(z, x); return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1] }
const mul = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let v = 0; for (let k = 0; k < 4; k++) v += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = v } return o }

function program(vs, fs) {
  const p = gl.createProgram()
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader')
    gl.attachShader(p, s)
  }
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link')
  return p
}

function components() {
  const faces = [
    [[-0.46, 1, -0.46], [0.46, 1, -0.46], [0.46, 1, 0.46], [-0.46, 1, 0.46], [0, 1, 0]],
    [[-0.46, 0, 0.46], [0.46, 0, 0.46], [0.46, 1, 0.46], [-0.46, 1, 0.46], [0, 0, 1]],
    [[0.46, 0, -0.46], [-0.46, 0, -0.46], [-0.46, 1, -0.46], [0.46, 1, -0.46], [0, 0, -1]],
    [[0.46, 0, 0.46], [0.46, 0, -0.46], [0.46, 1, -0.46], [0.46, 1, 0.46], [1, 0, 0]],
    [[-0.46, 0, -0.46], [-0.46, 0, 0.46], [-0.46, 1, 0.46], [-0.46, 1, -0.46], [-1, 0, 0]],
  ]
  const out = []
  for (let x = -8; x <= 8; x++) for (let z = -8; z <= 8; z++) {
    const seed = rnd(x * 43 + z * 79)
    if (seed < 0.24 || (Math.abs(x) < 2 && Math.abs(z) < 2)) continue
    const h = seed > 0.82 ? 1.8 + seed : 0.25 + seed * 0.65
    for (const f of faces) for (const i of [0, 1, 2, 0, 2, 3]) out.push(...f[i].slice(0, 3), ...f[4], x, z, h, seed)
  }
  for (const f of faces) for (const i of [0, 1, 2, 0, 2, 3]) out.push(...f[i].slice(0, 3), ...f[4], 0, 0, 3.1, 0.99)
  return new Float32Array(out)
}

function attrib(p, name, size, stride, offset) {
  const a = gl.getAttribLocation(p, name)
  gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, size, gl.FLOAT, false, stride, offset)
  return a
}

parrotify.register({
  webgl: true,
  maxPixelRatio: 1,
  color: '#1effb4',
  init(context) {
    gl = context; parts = program(VS, FS); board = program(BOARD_VS, BOARD_FS)
    const data = components(); count = data.length / 10
    partBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, partBuf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    boardBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, boardBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-60, -60, 60, -60, 60, 60, -60, -60, 60, 60, -60, 60]), gl.STATIC_DRAW)
    last = 0; flash = 0; lastBeats = 0
  },
  draw(g, f) {
    const dt = Math.min(0.1, Math.max(0, f.time - (last || f.time))); last = f.time
    if ((f.beats || 0) !== lastBeats) { lastBeats = f.beats || 0; flash = 1 }
    flash *= Math.exp(-dt * 7)
    const a = f.time * 0.055 + 0.65
    const eye = [Math.sin(a) * 24, 19 + Math.sin(f.time * 0.12), Math.cos(a) * 24]
    const mvp = mul(persp(0.78, f.pw / Math.max(1, f.ph), 0.1, 110), lookAt(eye, [0, 0.2, 0]))
    const tint = rgb(f.rgb)
    gl.clearColor(0.001, 0.006, 0.009, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND)
    gl.useProgram(board); gl.bindBuffer(gl.ARRAY_BUFFER, boardBuf)
    const ba = attrib(board, 'aPos', 2, 0, 0)
    gl.uniformMatrix4fv(gl.getUniformLocation(board, 'uMvp'), false, mvp)
    gl.uniform3fv(gl.getUniformLocation(board, 'uTint'), tint)
    gl.uniform1f(gl.getUniformLocation(board, 'uTime'), f.time % 100)
    gl.uniform1f(gl.getUniformLocation(board, 'uBass'), f.bass)
    gl.uniform1f(gl.getUniformLocation(board, 'uFlash'), f.playing ? flash : 0)
    gl.drawArrays(gl.TRIANGLES, 0, 6); gl.disableVertexAttribArray(ba)
    gl.useProgram(parts); gl.bindBuffer(gl.ARRAY_BUFFER, partBuf)
    const ap = attrib(parts, 'aPos', 3, 40, 0), an = attrib(parts, 'aNor', 3, 40, 12), ab = attrib(parts, 'aPart', 4, 40, 24)
    gl.uniformMatrix4fv(gl.getUniformLocation(parts, 'uMvp'), false, mvp)
    gl.uniform1f(gl.getUniformLocation(parts, 'uEnergy'), f.energy)
    gl.uniform1f(gl.getUniformLocation(parts, 'uBass'), f.bass)
    gl.uniform1f(gl.getUniformLocation(parts, 'uHigh'), f.high)
    gl.uniform1f(gl.getUniformLocation(parts, 'uFlash'), f.playing ? flash : 0)
    gl.uniform1f(gl.getUniformLocation(parts, 'uTime'), f.time % 100)
    gl.uniform3fv(gl.getUniformLocation(parts, 'uTint'), tint); gl.uniform3fv(gl.getUniformLocation(parts, 'uEye'), eye)
    gl.drawArrays(gl.TRIANGLES, 0, count)
    gl.disableVertexAttribArray(ap); gl.disableVertexAttribArray(an); gl.disableVertexAttribArray(ab)
  },
})
