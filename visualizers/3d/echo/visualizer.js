// Echo: a solid bust surrounded by four luminous, time-delayed silhouettes. Beats widen the
// echoes and reverse their phase, while the spectrum controls their colour, spacing and scanlines.
// Model: assets/bust.glb, "Classical Healer Bust" by Sana Sato (Sketchfab, CC BY 4.0), simplified
// (needs Parrotify 0.0.9+; without it only the backdrop).

const VS = `
attribute vec3 aPos; attribute vec3 aNor; attribute vec2 aUv;
uniform mat4 uMvp; uniform mat4 uModel;
varying vec3 vNor; varying vec3 vPos; varying vec2 vUv;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vPos = w.xyz; vNor = mat3(uModel) * aNor; vUv = aUv;
  gl_Position = uMvp * vec4(aPos, 1.0);
}`

const FS = `
precision mediump float;
varying vec3 vNor; varying vec3 vPos; varying vec2 vUv;
uniform sampler2D uTex; uniform float uHasTex;
uniform vec3 uKey; uniform float uKeyI; uniform vec3 uRim; uniform vec3 uTint; uniform vec3 uAccent;
uniform float uRimI; uniform vec3 uEye; uniform float uFog; uniform float uAlpha; uniform vec2 uCut;
uniform float uGhost; uniform float uPhase; uniform float uTime; uniform float uScan;
void main() {
  vec3 n = normalize(vNor);
  vec3 v = normalize(uEye - vPos);
  float dif = max(dot(n, uKey), 0.0);
  float fresnel = pow(1.0 - max(dot(n, v), 0.0), 2.7);
  float rim = fresnel * max(dot(n, uRim) + 0.5, 0.0);
  vec3 echoColor = mix(uTint, uAccent, 0.18 + uPhase * 0.64);
  float scan = 0.55 + 0.45 * sin(vPos.y * uScan - uTime * 8.0 + uPhase * 9.0);
  vec3 base = mix(vec3(0.7, 0.69, 0.67), texture2D(uTex, vUv).rgb, uHasTex);
  float wrap = max(dot(n, uKey) * 0.5 + 0.5, 0.0);
  float spe = pow(max(dot(reflect(-uKey, n), v), 0.0), 36.0);
  vec3 solid = base * (dif * uKeyI * vec3(0.86, 0.9, 1.0) + wrap * 0.055 + 0.018)
             + spe * 0.22 * uKeyI + echoColor * rim * uRimI;
  vec3 ghost = echoColor * (0.025 + dif * 0.09 + rim * (1.1 + uRimI * 0.25)
             + fresnel * scan * 0.14 + smoothstep(0.75, 1.0, scan) * 0.018);
  vec3 col = mix(solid, ghost, uGhost);
  float d = length(uEye - vPos);
  col *= exp(-uFog * d * d);
  col *= smoothstep(uCut.x, uCut.y, vPos.y);
  col = 1.0 - exp(-col * 1.25);
  gl_FragColor = vec4(pow(col, vec3(0.4545)), uAlpha);
}`

const BG_VS = `attribute vec2 p; varying vec2 uv; void main() { uv = p; gl_Position = vec4(p, 0.999, 1.0); }`
const BG_FS = `
precision mediump float;
varying vec2 uv; uniform vec3 uTint; uniform vec3 uAccent; uniform float uFlash; uniform float uTime;
uniform float uEnergy;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + floor(uTime * 12.0)) * 43758.5453); }
void main() {
  vec2 q = vec2(uv.x * 0.78, uv.y);
  float r = length(q);
  float ring1 = exp(-abs(r - 0.57 - uFlash * 0.035) * 150.0);
  float ring2 = exp(-abs(r - 0.82 + uFlash * 0.025) * 190.0);
  float sweep = pow(max(0.0, cos(atan(q.y, q.x) * 2.0 - uTime * 0.22)), 12.0);
  float haze = exp(-dot(uv - vec2(0.0, 0.15), uv - vec2(0.0, 0.15)) * 1.8);
  vec3 col = vec3(0.006, 0.005, 0.015) + uTint * haze * (0.025 + uEnergy * 0.02);
  col += uTint * ring1 * (0.025 + sweep * 0.08 + uFlash * 0.06);
  col += uAccent * ring2 * (0.018 + (1.0 - sweep) * 0.035);
  col *= 1.0 - dot(uv, uv) * 0.32;
  col += (hash(uv * 360.0) - 0.5) * 0.009;
  gl_FragColor = vec4(col, 1.0);
}`

let gl = null
let prog = null
let bg = null
let bgBuf = null
let model = null
let span = 1
let center = [0, 0, 0]
let height = 1
let loading = false

let shot = 1
let shotAt = 0
let lastBeats = 0
let flash = 0
let split = 0
let angle = 0
let ghostDir = 1
const trail = []
let last = 0

const persp = (fov, asp, n, f) => {
  const t = 1 / Math.tan(fov / 2)
  return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, (2 * f * n) / (n - f), 0]
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const lookAt = (eye, at, up) => {
  const z = norm(sub(eye, at)), x = norm(cross(up, z)), y = cross(z, x)
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]
}
const mul = (a, b) => {
  const o = new Array(16)
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let v = 0
    for (let k = 0; k < 4; k++) v += a[k * 4 + r] * b[c * 4 + k]
    o[c * 4 + r] = v
  }
  return o
}
const rotY = (a, s, c) => [Math.cos(a) * s, 0, -Math.sin(a) * s, 0, 0, s, 0, 0, Math.sin(a) * s, 0, Math.cos(a) * s, 0, -c[0] * s * Math.cos(a) - c[2] * s * Math.sin(a), -c[1] * s, c[0] * s * Math.sin(a) - c[2] * s * Math.cos(a), 1]
const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

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
  const big = !!gl.getExtension('OES_element_index_uint') || typeof WebGL2RenderingContext !== 'undefined'
  span = Math.max(glb.max[0] - glb.min[0], glb.max[1] - glb.min[1], glb.max[2] - glb.min[2]) || 1
  center = [0, 1, 2].map((i) => (glb.min[i] + glb.max[i]) / 2)
  height = glb.max[1] - glb.min[1] || 1
  model = glb.meshes.filter((m) => m.indices && (big || !(m.indices instanceof Uint32Array))).map((m) => {
    const n = m.position.length / 3
    const data = new Float32Array(n * 8)
    for (let i = 0; i < n; i++) {
      data.set(m.position.subarray(i * 3, i * 3 + 3), i * 8)
      if (m.normal) data.set(m.normal.subarray(i * 3, i * 3 + 3), i * 8 + 3)
      if (m.uv) data.set(m.uv.subarray(i * 2, i * 2 + 2), i * 8 + 6)
    }
    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    const ibo = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.indices, gl.STATIC_DRAW)
    let tex = null
    if (m.texture) {
      tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, m.texture)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    }
    const type = m.indices instanceof Uint32Array ? gl.UNSIGNED_INT : m.indices instanceof Uint8Array ? gl.UNSIGNED_BYTE : gl.UNSIGNED_SHORT
    return { vbo, ibo, count: m.indices.length, type, tex }
  })
}

const rgb = (s) => String(s || '255, 255, 255').split(',').map((v) => (Number(v) || 0) / 255)

parrotify.register({
  webgl: true,
  maxPixelRatio: 1,
  color: '#b48cff',
  init(context) {
    gl = context
    prog = program(VS, FS)
    bg = program(BG_VS, BG_FS)
    bgBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, bgBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    model = null
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
      split = 1
      if (f.beats % 4 === 0 && f.time - shotAt > 1.2) { shot++; shotAt = f.time }
      if (rnd(f.beats * 2.3) < 0.38) ghostDir = -ghostDir
    }
    if (f.time - shotAt > 7) { shot++; shotAt = f.time }
    flash *= Math.exp(-dt * 7)
    split *= Math.exp(-dt * 3.8)
    angle += (0.18 + f.bass * 0.72 + f.energy * 0.12) * dt
    trail.unshift(angle)
    if (trail.length > 60) trail.length = 60

    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    const tint = rgb(f.rgb)
    const accent = rgb(f.accentRgb)
    const beatFlash = f.playing ? flash : 0
    gl.disable(gl.DEPTH_TEST)
    gl.useProgram(bg)
    gl.bindBuffer(gl.ARRAY_BUFFER, bgBuf)
    const bp = gl.getAttribLocation(bg, 'p')
    gl.enableVertexAttribArray(bp)
    gl.vertexAttribPointer(bp, 2, gl.FLOAT, false, 0, 0)
    gl.uniform3fv(gl.getUniformLocation(bg, 'uTint'), tint)
    gl.uniform3fv(gl.getUniformLocation(bg, 'uAccent'), accent)
    gl.uniform1f(gl.getUniformLocation(bg, 'uFlash'), beatFlash)
    gl.uniform1f(gl.getUniformLocation(bg, 'uTime'), f.time % 100)
    gl.uniform1f(gl.getUniformLocation(bg, 'uEnergy'), f.energy)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.disableVertexAttribArray(bp)
    if (!model) return

    const t = f.time - shotAt
    const kind = Math.floor(rnd(shot) * 5)
    const side = (rnd(shot + 0.4) - 0.5) * 2.2
    const distances = [1.42, 1.72, 1.55, 1.85, 1.35]
    const heights = [0.1, 0.05, -0.18, 0.5, 0.24]
    const looks = [0.22, 0.14, 0.18, 0.1, 0.24]
    const dist = span * (distances[kind] - t * 0.018)
    const look = [center[0], center[1] + span * looks[kind], center[2]]
    const eye = [look[0] + Math.sin(side) * dist, look[1] + span * heights[kind], look[2] + Math.cos(side) * dist]
    const key = norm([Math.sin(side + 1.4), 0.9, Math.cos(side + 1.4)])
    const view = lookAt(eye, look, [0, 1, 0])
    const proj = persp(kind === 3 ? 0.85 : 0.75, f.pw / Math.max(1, f.ph), span * 0.05, span * 12)

    gl.enable(gl.DEPTH_TEST)
    gl.useProgram(prog)
    const U = (n) => gl.getUniformLocation(prog, n)
    gl.uniform3fv(U('uKey'), key)
    gl.uniform3fv(U('uRim'), norm([-key[0], 0.3, -key[2]]))
    gl.uniform3fv(U('uTint'), tint)
    gl.uniform3fv(U('uAccent'), accent)
    gl.uniform3fv(U('uEye'), eye)
    gl.uniform1f(U('uFog'), 0.045 / (span * span))
    gl.uniform2f(U('uCut'), -height * 0.2, -height * 0.02)
    gl.uniform1f(U('uTime'), f.time)
    gl.uniform1f(U('uScan'), 75 / Math.max(0.001, height))
    const aPos = gl.getAttribLocation(prog, 'aPos'), aNor = gl.getAttribLocation(prog, 'aNor'), aUv = gl.getAttribLocation(prog, 'aUv')
    for (let gi = 4; gi >= 0; gi--) {
      const lag = gi * 8
      const past = trail[Math.min(lag, trail.length - 1)] ?? angle
      const a = gi === 0 ? angle : angle + ghostDir * (angle - past) * (2.1 + split * 1.5)
      const direction = gi % 2 ? 1 : -1
      const spacing = span * (0.075 + f.bass * 0.045) * (1 + split * 1.8)
      const offset = gi === 0 ? 0 : direction * spacing * gi
      const m = rotY(a, gi === 0 ? 1 : 1 + gi * split * 0.008, center)
      m[12] += offset
      m[13] += gi === 0 ? 0 : Math.sin(gi * 2.2 + f.time * 1.5) * span * split * 0.018
      gl.uniformMatrix4fv(U('uMvp'), false, mul(proj, mul(view, m)))
      gl.uniformMatrix4fv(U('uModel'), false, m)
      gl.uniform1f(U('uKeyI'), gi === 0 ? 0.55 + beatFlash * 0.9 + f.energy * 0.35 : 0.25 + f.high * 0.5)
      gl.uniform1f(U('uRimI'), gi === 0 ? 0.55 + f.high * 1.25 : 0.75 + f.high * 0.8)
      gl.uniform1f(U('uAlpha'), gi === 0 ? 1 : 0.3 - gi * 0.035)
      gl.uniform1f(U('uGhost'), gi === 0 ? 0 : 1)
      gl.uniform1f(U('uPhase'), gi / 4)
      if (gi === 0) {
        gl.disable(gl.BLEND)
        gl.depthMask(true)
      } else {
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
        gl.depthMask(false)
      }
      for (const part of model) {
        gl.bindBuffer(gl.ARRAY_BUFFER, part.vbo)
        gl.enableVertexAttribArray(aPos)
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 32, 0)
        if (aNor >= 0) { gl.enableVertexAttribArray(aNor); gl.vertexAttribPointer(aNor, 3, gl.FLOAT, false, 32, 12) }
        if (aUv >= 0) { gl.enableVertexAttribArray(aUv); gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 32, 24) }
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, part.tex)
        gl.uniform1i(U('uTex'), 0)
        gl.uniform1f(U('uHasTex'), part.tex ? 1 : 0)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, part.ibo)
        gl.drawElements(gl.TRIANGLES, part.count, part.type, 0)
      }
    }
    gl.depthMask(true)
    gl.disable(gl.BLEND)
  },
})
