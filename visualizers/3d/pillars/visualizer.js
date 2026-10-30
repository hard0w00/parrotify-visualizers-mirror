// Pillars: a field of stone pillars in the dark. Each one rises with the band of the spectrum of
// its distance from the middle (bass in the centre, highs at the edge), a ring of light runs out
// from the centre on every beat, and the camera glides low over the field, cutting to a new run
// every few beats. No model needed.

const N = 24 // pillars per side

const VS = `
attribute vec3 aCorner; attribute vec2 aCell; attribute vec3 aNor;
uniform mat4 uMvp; uniform float uLevels[32]; uniform float uWave;
varying vec3 vNor; varying float vTop; varying float vLevel; varying float vWave; varying vec3 vPos;
void main() {
  vec2 c = aCell - ${((N - 1) / 2).toFixed(1)};
  float r = length(c) / ${(N / 2).toFixed(1)};
  int band = int(clamp(r * 31.0, 0.0, 31.0));
  float level = 0.0;
  for (int i = 0; i < 32; i++) if (i == band) level = uLevels[i];
  float h = 0.18 + level * 2.6;
  vec3 p = vec3(c.x * 1.4 + aCorner.x * 0.5, aCorner.y * h, c.y * 1.4 + aCorner.z * 0.5);
  vNor = aNor;
  vTop = aCorner.y;
  vLevel = level;
  vWave = exp(-pow((r - uWave) * 9.0, 2.0));
  vPos = p;
  gl_Position = uMvp * vec4(p, 1.0);
}`

const FS = `
precision highp float;
varying vec3 vNor; varying float vTop; varying float vLevel; varying float vWave; varying vec3 vPos;
uniform vec3 uTint; uniform float uFlash; uniform vec3 uEye; uniform vec3 uKey;
void main() {
  // dark stone lit from one side; the caps glow with the level, the beat's ring runs over them
  float dif = max(dot(vNor, uKey), 0.0);
  vec3 stone = vec3(0.035, 0.032, 0.04) * (0.1 + 0.9 * dif) * (0.2 + 0.8 * vTop);
  float cap = step(0.5, vNor.y);
  // the caps glow with the level; the sides catch a little of it near the top
  vec3 glow = uTint * cap * (0.04 + vLevel * vLevel * 1.4) + uTint * (1.0 - cap) * pow(vTop, 6.0) * vLevel * 0.35
            + uTint * vWave * (0.15 + 0.85 * vTop) * (0.4 + uFlash * 0.8);
  vec3 col = stone + glow;
  float d = length(uEye - vPos);
  // close to the camera a pillar dissolves (dithered, like in games) instead of clipping into the lens
  float near = smoothstep(0.9, 3.2, d);
  float noise = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  if (near < noise) discard;
  col *= exp(-0.006 * d * d) * near;
  gl_FragColor = vec4(pow(col, vec3(0.4545)), 1.0);
}`

let gl = null
let prog = null
let buf = null
let count = 0
let shot = 1
let shotAt = 0
let lastBeats = 0
let flash = 0
let wave = 2 // the ring's radius (0 centre … 1 edge; beyond: gone)
let last = 0
const smoothLevels = new Float32Array(32)

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
const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
const rgb = (s) => String(s || '255, 170, 80').split(',').map((v) => (Number(v) || 0) / 255)

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

// one box per pillar: 5 faces (no bottom), 2 triangles each; corner (x ±1, y 0/1, z ±1) + cell
function field() {
  const faces = [
    [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]], // top
    [[-1, 0, 1], [1, 0, 1], [1, 1, 1], [-1, 1, 1]],
    [[1, 0, -1], [-1, 0, -1], [-1, 1, -1], [1, 1, -1]],
    [[1, 0, 1], [1, 0, -1], [1, 1, -1], [1, 1, 1]],
    [[-1, 0, -1], [-1, 0, 1], [-1, 1, 1], [-1, 1, -1]],
  ]
  const normals = [[0, 1, 0], [0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0]]
  const out = []
  for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
    faces.forEach((f, fi) => { for (const i of [0, 1, 2, 0, 2, 3]) out.push(...f[i], x, z, ...normals[fi]) })
  }
  return new Float32Array(out)
}

parrotify.register({
  webgl: true,
  maxPixelRatio: 1,
  color: '#ffaa50',
  init(context) {
    gl = context
    prog = program(VS, FS)
    const data = field()
    buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    count = data.length / 8
  },
  draw(g, f) {
    const dt = Math.min(0.1, Math.max(0, f.time - (last || f.time)))
    last = f.time
    if (f.beats !== lastBeats) {
      lastBeats = f.beats
      flash = 0.7
      wave = 0
      if (f.beats % 16 === 0 && f.time - shotAt > 4) { shot++; shotAt = f.time }
    }
    if (f.time - shotAt > 14) { shot++; shotAt = f.time }
    flash *= Math.exp(-dt * 3)
    wave += dt * 0.8

    gl.clearColor(0.004, 0.003, 0.006, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.useProgram(prog)

    // a run low over the field: from a side, heading across, slowly moving
    const t = f.time - shotAt
    const dir = rnd(shot) * Math.PI * 2
    const height = 2.4 + rnd(shot + 0.3) * 3
    const run = -16 + t * (0.65 + rnd(shot + 0.6) * 0.35)
    const sideways = (rnd(shot + 0.9) - 0.5) * 10
    const eye = [Math.cos(dir) * run - Math.sin(dir) * sideways, height, Math.sin(dir) * run + Math.cos(dir) * sideways]
    const look = [eye[0] + Math.cos(dir) * 10, 0.6, eye[2] + Math.sin(dir) * 10]
    const mvp = mul(persp(1.0, f.pw / Math.max(1, f.ph), 0.1, 120), lookAt(eye, look))

    const U = (n) => gl.getUniformLocation(prog, n)
    gl.uniformMatrix4fv(U('uMvp'), false, mvp)
    const lv = smoothLevels
    for (let i = 0; i < 32; i++) {
      const target = Math.max(f.levels[i * 2] || 0, f.levels[i * 2 + 1] || 0)
      lv[i] += (target - lv[i]) * Math.min(1, dt * 3)
    }
    gl.uniform1fv(U('uLevels[0]'), lv)
    gl.uniform1f(U('uWave'), f.playing ? wave : 2)
    gl.uniform3fv(U('uTint'), rgb(f.rgb))
    gl.uniform1f(U('uFlash'), f.playing ? flash : 0)
    gl.uniform3fv(U('uEye'), eye)
    gl.uniform3fv(U('uKey'), norm([Math.cos(dir + 2.2), 0.8, Math.sin(dir + 2.2)]))
    const aC = gl.getAttribLocation(prog, 'aCorner'), aP = gl.getAttribLocation(prog, 'aCell'), aN = gl.getAttribLocation(prog, 'aNor')
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.enableVertexAttribArray(aC)
    gl.vertexAttribPointer(aC, 3, gl.FLOAT, false, 32, 0)
    gl.enableVertexAttribArray(aP)
    gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 32, 12)
    gl.enableVertexAttribArray(aN)
    gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 32, 20)
    gl.drawArrays(gl.TRIANGLES, 0, count)
    gl.disableVertexAttribArray(aC)
    gl.disableVertexAttribArray(aP)
    gl.disableVertexAttribArray(aN)
  },
})
