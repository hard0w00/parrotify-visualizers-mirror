const BG_VS = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos; gl_Position = vec4(aPos, 0.999, 1.0); }`

const BG_FS = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uPulse;
uniform vec3 uTint;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 p = vUv * vec2(1.0, 0.75);
  float depth = smoothstep(-1.0, 0.9, p.y);
  vec3 col = mix(vec3(0.002, 0.012, 0.035), vec3(0.008, 0.12, 0.18), depth);
  float x = p.x + 0.16 * sin(p.y * 2.0 + uTime * 0.12);
  float rays = pow(0.5 + 0.5 * sin(x * 15.0 + p.y * 2.8), 10.0);
  rays += 0.6 * pow(0.5 + 0.5 * sin(x * 27.0 - p.y * 3.5 + 1.7), 16.0);
  rays *= smoothstep(-0.9, 0.75, p.y) * (0.055 + uPulse * 0.06);
  col += mix(vec3(0.04, 0.35, 0.5), uTint, 0.3) * rays;
  float mote = step(0.9985, hash(floor((vUv + uTime * vec2(0.002, -0.006)) * 260.0)));
  col += vec3(0.15, 0.5, 0.55) * mote * 0.18;
  col *= 1.0 - 0.22 * dot(p, p);
  gl_FragColor = vec4(col, 1.0);
}`

const VS = `
attribute vec2 aPos;
uniform mat4 uMvp;
uniform vec3 uEye;
uniform float uTime;
uniform float uBass;
uniform float uPulse;
uniform float uLevels[24];
varying vec3 vPos;
varying vec3 vNor;
varying float vLevel;
float levelAt(vec2 p) {
  float n = clamp((p.x + 12.0) / 24.0 * 23.0, 0.0, 23.0);
  float v = 0.0;
  for (int i = 0; i < 24; i++) if (i == int(n)) v = uLevels[i];
  return v;
}
float wave(vec2 p) {
  float a = sin(p.x * 0.48 + uTime * 0.55) * cos(p.y * 0.34 - uTime * 0.32);
  float b = sin(p.x * 0.85 - p.y * 0.55 + uTime * 0.42);
  float c = sin(length(p + vec2(3.0, 5.0)) * 0.9 - uTime * 0.7);
  float ring = sin(length(p) * 2.4 - uTime * 4.0) * exp(-length(p) * 0.15);
  return a * 0.65 + b * 0.24 + c * 0.17 + levelAt(p) * (0.35 + uBass * 0.7) + ring * uPulse * 0.25;
}
void main() {
  float h = wave(aPos);
  float e = 0.09;
  float dx = wave(aPos + vec2(e, 0.0)) - wave(aPos - vec2(e, 0.0));
  float dz = wave(aPos + vec2(0.0, e)) - wave(aPos - vec2(0.0, e));
  vPos = vec3(aPos.x, h - 2.0, aPos.y);
  vNor = normalize(vec3(-dx, 2.0 * e, -dz));
  vLevel = levelAt(aPos);
  gl_Position = uMvp * vec4(vPos, 1.0);
}`

const FS = `
precision highp float;
varying vec3 vPos;
varying vec3 vNor;
varying float vLevel;
uniform vec3 uEye;
uniform vec3 uTint;
uniform float uTime;
uniform float uPulse;
uniform float uHigh;
void main() {
  vec3 n = normalize(vNor);
  vec3 viewDir = normalize(uEye - vPos);
  vec3 lightDir = normalize(vec3(-0.35, 0.85, 0.4));
  float diffuse = max(dot(n, lightDir), 0.0);
  float ca = sin(vPos.x * 3.2 + sin(vPos.z * 2.6 + uTime) + uTime * 0.7);
  ca *= sin(vPos.z * 3.5 + sin(vPos.x * 2.1 - uTime * 0.8));
  float caustic = pow(abs(ca), 7.0) * (0.2 + diffuse) * (0.5 + uHigh);
  float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
  vec3 base = mix(vec3(0.008, 0.07, 0.105), vec3(0.015, 0.19, 0.21), diffuse);
  base = mix(base, uTint * 0.24, 0.18 + vLevel * 0.16);
  vec3 col = base + vec3(0.12, 0.65, 0.72) * caustic * (0.35 + uPulse * 0.35);
  col += uTint * rim * (0.045 + vLevel * 0.12);
  float dist = length(uEye - vPos);
  float fog = 1.0 - exp(-0.018 * dist * dist);
  col = mix(col, vec3(0.003, 0.025, 0.06), fog);
  gl_FragColor = vec4(col, 1.0);
}`

const POINT_VS = `
attribute vec3 aPos;
attribute float aSeed;
uniform mat4 uMvp;
uniform float uTime;
uniform float uEnergy;
uniform float uHeight;
varying float vAlpha;
void main() {
  vec3 p = aPos;
  p.y = mod(p.y + uTime * (0.06 + aSeed * 0.15) + 3.0, 9.0) - 3.0;
  p.x += sin(uTime * 0.3 + aSeed * 30.0 + p.y) * 0.25;
  p.z += cos(uTime * 0.2 + aSeed * 20.0) * 0.18;
  vec4 clip = uMvp * vec4(p, 1.0);
  gl_Position = clip;
  gl_PointSize = clamp((1.0 + aSeed * 2.4 + uEnergy) * uHeight / max(clip.w, 0.5), 1.0, 7.0);
  vAlpha = 0.25 + aSeed * 0.65;
}`

const POINT_FS = `
precision mediump float;
varying float vAlpha;
uniform vec3 uTint;
uniform float uPulse;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = dot(p, p);
  if (d > 0.25) discard;
  float glow = exp(-d * 13.0);
  gl_FragColor = vec4(mix(vec3(0.2, 0.8, 0.9), uTint, 0.35) * (0.6 + uPulse), glow * vAlpha);
}`

let gl
let terrain
let particles
let bg
let bgBuffer
let particleBuffer
let indexBuffer
let indexCount
let particleCount = 320
let last = 0
let lastBeats = -1
let pulse = 0

const sub = (a, b) => a.map((v, i) => v - b[i])
const dot = (a, b) => a.reduce((v, n, i) => v + n * b[i], 0)
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((v) => v / l) }
const persp = (fov, aspect, near, far) => { const t = 1 / Math.tan(fov / 2); return [t / aspect, 0, 0, 0, 0, t, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0] }
const lookAt = (eye, at) => {
  const z = norm(sub(eye, at)), x = norm(cross([0, 1, 0], z)), y = cross(z, x)
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]
}
const mul = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let v = 0; for (let k = 0; k < 4; k++) v += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = v } return o }
const rgb = (s) => String(s || '60, 210, 220').split(',').map((v) => (Number(v) || 0) / 255)

function program(vs, fs) {
  const p = gl.createProgram()
  for (const [type, source] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'shader')
    gl.attachShader(p, shader)
    gl.deleteShader(shader)
  }
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link')
  return p
}

function uniforms(p, names) {
  return Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(p, name)]))
}

function makeTerrain() {
  const n = 52
  const vertices = []
  const indices = []
  for (let z = 0; z <= n; z++) for (let x = 0; x <= n; x++) vertices.push((x / n - 0.5) * 24, (z / n - 0.65) * 24)
  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
    const a = z * (n + 1) + x, b = a + n + 1
    indices.push(a, b, a + 1, a + 1, b, b + 1)
  }
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
  indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
  indexCount = indices.length
  return buffer
}

function makeParticles() {
  const data = []
  for (let i = 0; i < particleCount; i++) {
    const a = Math.sin(i * 127.1 + 311.7) * 43758.5453
    const b = Math.sin(i * 269.5 + 183.3) * 28001.8384
    const c = Math.sin(i * 419.2 + 371.9) * 19349.6731
    const r = (v) => v - Math.floor(v)
    data.push((r(a) - 0.5) * 22, r(b) * 9 - 3, (r(c) - 0.65) * 22, r(a + b))
  }
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
  return buffer
}

parrotify.register({
  webgl: true,
  maxPixelRatio: 1,
  color: '#42d9df',
  init(context) {
    gl = context
    bg = { p: program(BG_VS, BG_FS), a: 0 }
    bg.u = uniforms(bg.p, ['uTime', 'uPulse', 'uTint'])
    terrain = { p: program(VS, FS), buffer: makeTerrain() }
    terrain.u = uniforms(terrain.p, ['uMvp', 'uEye', 'uTime', 'uBass', 'uPulse', 'uLevels[0]', 'uTint', 'uHigh'])
    particles = { p: program(POINT_VS, POINT_FS) }
    particles.u = uniforms(particles.p, ['uMvp', 'uTime', 'uEnergy', 'uHeight', 'uTint', 'uPulse'])
    bgBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, bgBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    particleBuffer = makeParticles()
  },
  draw(g, f) {
    const dt = Math.min(0.1, Math.max(0, f.time - (last || f.time)))
    last = f.time
    const beats = f.beats || 0
    if (beats !== lastBeats) { lastBeats = beats; pulse = f.playing ? 1 : 0 }
    pulse *= Math.exp(-dt * 4.5)
    const time = f.time % 1000
    const tint = rgb(f.rgb)
    const angle = Math.sin(time * 0.07) * 0.38
    const eye = [Math.sin(angle) * 8.5, 2.7 + Math.sin(time * 0.17) * 0.35 + f.bass * 0.25, Math.cos(angle) * 8.5]
    const mvp = mul(persp(0.92, f.pw / Math.max(1, f.ph), 0.1, 70), lookAt(eye, [0, -1.0, -4.5]))
    gl.disable(gl.BLEND)
    gl.depthMask(true)
    gl.clearColor(0.002, 0.008, 0.025, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.disable(gl.DEPTH_TEST)
    gl.useProgram(bg.p)
    gl.bindBuffer(gl.ARRAY_BUFFER, bgBuffer)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.uniform1f(bg.u.uTime, time)
    gl.uniform1f(bg.u.uPulse, pulse)
    gl.uniform3fv(bg.u.uTint, tint)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.enable(gl.DEPTH_TEST)
    gl.useProgram(terrain.p)
    gl.bindBuffer(gl.ARRAY_BUFFER, terrain.buffer)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.uniformMatrix4fv(terrain.u.uMvp, false, mvp)
    gl.uniform3fv(terrain.u.uEye, eye)
    gl.uniform1f(terrain.u.uTime, time)
    gl.uniform1f(terrain.u.uBass, f.bass)
    gl.uniform1f(terrain.u.uPulse, pulse)
    gl.uniform1f(terrain.u.uHigh, f.high)
    gl.uniform3fv(terrain.u.uTint, tint)
    const levels = new Float32Array(24)
    for (let i = 0; i < 24; i++) levels[i] = Math.max(f.levels[Math.min(63, i * 2)] || 0, f.levels[Math.min(63, i * 2 + 1)] || 0)
    gl.uniform1fv(terrain.u['uLevels[0]'], levels)
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
    gl.depthMask(false)
    gl.useProgram(particles.p)
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12)
    gl.uniformMatrix4fv(particles.u.uMvp, false, mvp)
    gl.uniform1f(particles.u.uTime, time)
    gl.uniform1f(particles.u.uEnergy, f.energy)
    gl.uniform1f(particles.u.uHeight, f.ph * 0.07)
    gl.uniform1f(particles.u.uPulse, pulse)
    gl.uniform3fv(particles.u.uTint, tint)
    gl.drawArrays(gl.POINTS, 0, particleCount)
    gl.depthMask(true)
    gl.disable(gl.BLEND)
    gl.disableVertexAttribArray(1)
  },
})
