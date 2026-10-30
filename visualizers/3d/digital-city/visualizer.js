const VS = `
attribute vec3 aPos; attribute vec3 aNor; attribute vec4 aBuilding;
uniform mat4 uMvp; uniform float uLevels[16]; uniform float uBass;
varying vec3 vPos; varying vec3 vLocal; varying vec3 vNor; varying float vSeed; varying float vLevel;
void main() {
  float band = mod(abs(aBuilding.x) + abs(aBuilding.y), 16.0);
  float level = 0.0;
  for (int i = 0; i < 16; i++) if (float(i) == band) level = uLevels[i];
  float h = aBuilding.z * (0.88 + level * 0.24 + uBass * 0.06);
  vec3 p = vec3(aBuilding.x * 2.7 + aPos.x, aPos.y * h, aBuilding.y * 2.7 + aPos.z);
  vPos = p; vLocal = vec3(aPos.x, aPos.y * h, aPos.z); vNor = aNor;
  vSeed = aBuilding.w; vLevel = level;
  gl_Position = uMvp * vec4(p, 1.0);
}`

const FS = `
precision highp float;
varying vec3 vPos; varying vec3 vLocal; varying vec3 vNor; varying float vSeed; varying float vLevel;
uniform vec3 uTint; uniform vec3 uEye; uniform float uTime; uniform float uFlash;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + vSeed * 19.0) * 43758.5453); }
void main() {
  float side = 1.0 - abs(vNor.y);
  vec2 uv = vec2(vLocal.x + vLocal.z, vLocal.y);
  vec2 cell = floor(uv * vec2(3.2, 2.5));
  vec2 f = fract(uv * vec2(3.2, 2.5));
  float window = step(0.18, f.x) * step(f.x, 0.72) * step(0.22, f.y) * step(f.y, 0.68);
  float lit = step(0.37, hash(cell)) * window * side;
  float scan = 0.8 + 0.2 * sin(vPos.y * 14.0 - uTime * 3.0);
  float edge = pow(1.0 - abs(dot(normalize(vNor), normalize(uEye - vPos))), 4.0);
  float roof = step(0.5, vNor.y);
  vec3 base = vec3(0.008, 0.014, 0.027) + vec3(0.025, 0.04, 0.065) * max(dot(vNor, normalize(vec3(-0.4, 0.8, 0.3))), 0.0);
  vec3 col = base + uTint * lit * scan * (0.28 + vLevel * 1.7 + uFlash * 0.5);
  col += uTint * edge * (0.025 + vLevel * 0.08) + uTint * roof * (0.035 + uFlash * 0.08);
  float fog = 1.0 - exp(-length(uEye - vPos) * 0.025);
  col = mix(col, vec3(0.008, 0.012, 0.03), fog);
  gl_FragColor = vec4(col, 1.0);
}`

const GROUND_VS = `
attribute vec2 aPos; uniform mat4 uMvp; varying vec2 vWorld;
void main() { vWorld = aPos; gl_Position = uMvp * vec4(aPos.x, -0.025, aPos.y, 1.0); }`
const GROUND_FS = `
precision highp float;
varying vec2 vWorld; uniform vec3 uTint; uniform float uTime; uniform float uFlash; uniform float uBass;
void main() {
  vec2 p = vWorld / 2.7;
  vec2 g = abs(fract(p + 0.5) - 0.5);
  float road = 1.0 - smoothstep(0.40, 0.48, max(g.x, g.y));
  vec2 lane = abs(fract(p) - 0.5);
  float line = (1.0 - smoothstep(0.012, 0.026, min(lane.x, lane.y))) * road;
  float traffic = pow(0.5 + 0.5 * sin((p.x + p.y) * 8.0 - uTime * 7.0), 18.0) * line;
  float grid = (1.0 - smoothstep(0.0, 0.018, min(g.x, g.y))) * 0.25;
  float r = length(vWorld);
  float pulse = exp(-pow(r - uFlash * 0.0, 2.0));
  vec3 col = vec3(0.004, 0.008, 0.018) + uTint * (line * (0.06 + traffic * (0.5 + uBass)) + grid * 0.05);
  col += uTint * road * 0.008 * (0.5 + uFlash);
  col *= 1.0 - smoothstep(25.0, 70.0, r);
  gl_FragColor = vec4(col, 1.0);
}`

let gl, city, ground, cityBuf, groundBuf, count
let last = 0, flash = 0, lastBeats = 0
const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
const rgb = (s) => String(s || '40, 220, 255').split(',').map((v) => (Number(v) || 0) / 255)
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

function buildings() {
  const faces = [
    [[-0.43, 1, -0.43], [0.43, 1, -0.43], [0.43, 1, 0.43], [-0.43, 1, 0.43], [0, 1, 0]],
    [[-0.43, 0, 0.43], [0.43, 0, 0.43], [0.43, 1, 0.43], [-0.43, 1, 0.43], [0, 0, 1]],
    [[0.43, 0, -0.43], [-0.43, 0, -0.43], [-0.43, 1, -0.43], [0.43, 1, -0.43], [0, 0, -1]],
    [[0.43, 0, 0.43], [0.43, 0, -0.43], [0.43, 1, -0.43], [0.43, 1, 0.43], [1, 0, 0]],
    [[-0.43, 0, -0.43], [-0.43, 0, 0.43], [-0.43, 1, 0.43], [-0.43, 1, -0.43], [-1, 0, 0]],
  ]
  const out = []
  for (let x = -7; x <= 7; x++) for (let z = -7; z <= 7; z++) {
    if (x % 4 === 0 || z % 4 === 0) continue
    const d = Math.hypot(x, z)
    const h = 1.1 + rnd(x * 31 + z * 17) * 4.2 + Math.max(0, 5 - d) * 0.35
    for (const f of faces) for (const i of [0, 1, 2, 0, 2, 3]) out.push(...f[i].slice(0, 3), ...f[4], x, z, h, rnd(x * 71 + z * 43))
  }
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
  color: '#28dcff',
  init(context) {
    gl = context; city = program(VS, FS); ground = program(GROUND_VS, GROUND_FS)
    const data = buildings(); count = data.length / 10
    cityBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cityBuf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    groundBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, groundBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-70, -70, 70, -70, 70, 70, -70, -70, 70, 70, -70, 70]), gl.STATIC_DRAW)
    last = 0; flash = 0; lastBeats = 0
  },
  draw(g, f) {
    const dt = Math.min(0.1, Math.max(0, f.time - (last || f.time))); last = f.time
    if ((f.beats || 0) !== lastBeats) { lastBeats = f.beats || 0; flash = 1 }
    flash *= Math.exp(-dt * 5)
    const angle = f.time * 0.075
    const eye = [Math.sin(angle) * 25, 10.5 + Math.sin(f.time * 0.17), Math.cos(angle) * 25]
    const mvp = mul(persp(0.82, f.pw / Math.max(1, f.ph), 0.1, 120), lookAt(eye, [0, 2.2, 0]))
    const tint = rgb(f.rgb)
    gl.clearColor(0.003, 0.006, 0.018, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND)
    gl.useProgram(ground); gl.bindBuffer(gl.ARRAY_BUFFER, groundBuf)
    const ga = attrib(ground, 'aPos', 2, 0, 0)
    gl.uniformMatrix4fv(gl.getUniformLocation(ground, 'uMvp'), false, mvp)
    gl.uniform3fv(gl.getUniformLocation(ground, 'uTint'), tint)
    gl.uniform1f(gl.getUniformLocation(ground, 'uTime'), f.time % 100)
    gl.uniform1f(gl.getUniformLocation(ground, 'uFlash'), f.playing ? flash : 0)
    gl.uniform1f(gl.getUniformLocation(ground, 'uBass'), f.bass)
    gl.drawArrays(gl.TRIANGLES, 0, 6); gl.disableVertexAttribArray(ga)
    gl.useProgram(city); gl.bindBuffer(gl.ARRAY_BUFFER, cityBuf)
    const ap = attrib(city, 'aPos', 3, 40, 0), an = attrib(city, 'aNor', 3, 40, 12), ab = attrib(city, 'aBuilding', 4, 40, 24)
    gl.uniformMatrix4fv(gl.getUniformLocation(city, 'uMvp'), false, mvp)
    const levels = new Float32Array(16)
    for (let i = 0; i < 16; i++) levels[i] = Math.max(f.levels[i * 2] || 0, f.levels[i * 2 + 1] || 0)
    gl.uniform1fv(gl.getUniformLocation(city, 'uLevels[0]'), levels)
    gl.uniform1f(gl.getUniformLocation(city, 'uBass'), f.bass)
    gl.uniform1f(gl.getUniformLocation(city, 'uTime'), f.time % 100)
    gl.uniform1f(gl.getUniformLocation(city, 'uFlash'), f.playing ? flash : 0)
    gl.uniform3fv(gl.getUniformLocation(city, 'uTint'), tint); gl.uniform3fv(gl.getUniformLocation(city, 'uEye'), eye)
    gl.drawArrays(gl.TRIANGLES, 0, count)
    gl.disableVertexAttribArray(ap); gl.disableVertexAttribArray(an); gl.disableVertexAttribArray(ab)
  },
})
