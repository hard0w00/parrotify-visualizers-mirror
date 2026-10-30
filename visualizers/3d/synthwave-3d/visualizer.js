const VS = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FS = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform vec3 uTint;
uniform vec3 uAccent;
uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uEnergy;
uniform float uBeat;
uniform float uLevels[16];

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += noise(p) * a;
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    a *= 0.5;
  }
  return v;
}
vec3 finish(vec3 col, vec2 p) {
  col = col / (col + vec3(0.85));
  col = pow(max(col, 0.0), vec3(0.4545));
  col *= 1.0 - 0.24 * dot(p * vec2(0.55, 0.8), p * vec2(0.55, 0.8));
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5) / 255.0;
  return col;
}
void main() {
  vec2 p = vec2(vUv.x * uRes.x / max(uRes.y, 1.0), vUv.y);
  float roll = sin(uTime * 0.19) * 0.012 + (uMid - 0.25) * 0.012;
  p = mat2(cos(roll), -sin(roll), sin(roll), cos(roll)) * p;
  float horizon = -0.13 + sin(uTime * 0.23) * 0.012;
  vec3 skyTop = vec3(0.018, 0.008, 0.075);
  vec3 skyLow = vec3(0.19, 0.018, 0.19) + uAccent * 0.055;
  vec3 col = mix(skyLow, skyTop, smoothstep(-0.15, 1.0, p.y));
  col += vec3(0.32, 0.025, 0.18) * exp(-abs(p.y - horizon) * 5.0) * 0.38;

  vec2 starGrid = floor((p + vec2(uTime * 0.001, 0.0)) * vec2(95.0, 70.0));
  vec2 starUv = fract(p * vec2(95.0, 70.0)) - 0.5;
  float starRnd = hash(starGrid);
  float stars = smoothstep(0.055, 0.0, length(starUv)) * step(0.978, starRnd);
  stars *= 0.45 + 0.55 * sin(uTime * (1.0 + starRnd * 3.0) + starRnd * 30.0);
  col += stars * smoothstep(0.0, 0.3, p.y) * mix(vec3(0.55, 0.7, 1.0), uTint, 0.25) * (0.65 + uHigh);

  vec2 sunP = vec2(sin(uTime * 0.1) * 0.055, 0.37 + sin(uTime * 0.17) * 0.012);
  vec2 q = p - sunP;
  float radius = 0.405 * (1.0 + uBass * 0.055 + uBeat * 0.025);
  float d = length(q * vec2(1.0, 1.04));
  float disc = 1.0 - smoothstep(radius - 0.004, radius + 0.004, d);
  float cuts = smoothstep(0.09, 0.19, abs(sin((q.y + 0.12) * 38.0)));
  cuts = mix(1.0, cuts, smoothstep(0.035, -0.12, q.y));
  disc *= cuts;
  vec3 sunCol = mix(vec3(1.0, 0.12, 0.34), vec3(1.0, 0.83, 0.24), smoothstep(-radius, radius, q.y));
  sunCol = mix(sunCol, uTint * 1.4, 0.08);
  col += sunCol * exp(-max(d - radius, 0.0) * 10.0) * (0.24 + uBeat * 0.22);
  col = mix(col, sunCol * (1.15 + uEnergy * 0.3), disc);

  float rFar = 0.015 + fbm(vec2(p.x * 1.25 + 7.0, 3.1)) * 0.29 + uLevels[2] * 0.035;
  float rNear = -0.065 + fbm(vec2(p.x * 1.85 + 19.0, 8.7)) * 0.34 + uLevels[5] * 0.055;
  float farMask = smoothstep(rFar + 0.004, rFar - 0.004, p.y) * smoothstep(horizon - 0.025, horizon + 0.02, p.y);
  col = mix(col, vec3(0.055, 0.018, 0.105) + uAccent * 0.035, farMask);
  col += vec3(0.5, 0.08, 0.42) * exp(-abs(p.y - rFar) * 180.0) * smoothstep(horizon, horizon + 0.04, p.y) * 0.45;
  float nearMask = smoothstep(rNear + 0.004, rNear - 0.004, p.y) * smoothstep(horizon - 0.025, horizon + 0.015, p.y);
  col = mix(col, vec3(0.018, 0.009, 0.04), nearMask);
  col += mix(vec3(0.95, 0.08, 0.38), uAccent, 0.22) * exp(-abs(p.y - rNear) * 230.0) * smoothstep(horizon, horizon + 0.04, p.y) * (0.75 + uHigh * 0.5);

  if (p.y < horizon) {
    vec3 ro = vec3(sin(uTime * 0.21) * (0.16 + uBass * 0.13), 1.25 + uBass * 0.22 + uBeat * 0.07, 0.0);
    vec3 rd = normalize(vec3(p.x, (p.y - horizon) * 1.05, -1.65));
    float t = -ro.y / min(rd.y, -0.001);
    vec3 pos = ro + rd * t;
    pos.z += uTime * (3.0 + uEnergy * 3.5);
    float gx = abs(fract(pos.x * 0.5) - 0.5);
    float gz = abs(fract(pos.z * 0.5) - 0.5);
    float w = 0.012 + t * 0.00075;
    float lx = 1.0 - smoothstep(w, w * 2.2, gx);
    float lz = 1.0 - smoothstep(w, w * 2.2, gz);
    float fade = exp(-t * 0.027) * smoothstep(0.0, 0.08, horizon - p.y);
    vec3 gridX = mix(vec3(0.03, 0.65, 1.0), uTint, 0.24);
    vec3 gridZ = mix(vec3(1.0, 0.025, 0.37), uAccent, 0.18);
    col = vec3(0.017, 0.006, 0.035) + vec3(0.12, 0.008, 0.09) * exp(-t * 0.025);
    col += (gridX * lx + gridZ * lz) * fade * (0.8 + uEnergy * 0.7 + uBeat * 0.45);
    float road = 1.0 - smoothstep(2.35, 2.5, abs(pos.x));
    col *= 1.0 - road * 0.28;
    float edge = exp(-abs(abs(pos.x) - 2.5) * 9.0) * fade;
    col += gridZ * edge * (1.3 + uBeat);
    float runner = exp(-abs(fract(pos.z * 0.075 - uTime * 0.22) - 0.5) * 28.0);
    col += gridX * runner * road * fade * (0.12 + uLevels[9] * 0.65);
    float reflection = exp(-p.x * p.x * 3.0) * exp(-abs(p.y - horizon) * 5.5);
    col += vec3(0.8, 0.035, 0.18) * reflection * (0.22 + uBass * 0.22);
  }
  col += uAccent * uBeat * 0.035;
  gl_FragColor = vec4(finish(col, p), 1.0);
}`

let gl = null
let prog = null
let buf = null
let loc = null
let attr = -1
let last = 0
let lastBeats = 0
let pulse = 0

function shader(type, source) {
  const s = gl.createShader(type)
  gl.shaderSource(s, source)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader')
  return s
}
function rgb(value, fallback) {
  const c = String(value || fallback).split(',').map((v) => Math.max(0, Math.min(1, (Number(v) || 0) / 255)))
  return c.length === 3 ? c : fallback.split(',').map((v) => Number(v) / 255)
}

parrotify.register({
  webgl: true,
  maxPixelRatio: 0.85,
  color: '#ff4f9a',
  init(context) {
    gl = context
    prog = gl.createProgram()
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS))
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link')
    buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    attr = gl.getAttribLocation(prog, 'aPos')
    loc = {}
    for (const n of ['uRes', 'uTint', 'uAccent', 'uTime', 'uBass', 'uMid', 'uHigh', 'uEnergy', 'uBeat', 'uLevels[0]']) loc[n] = gl.getUniformLocation(prog, n)
  },
  draw(g, f) {
    const dt = Math.min(0.1, Math.max(0, f.time - (last || f.time)))
    last = f.time
    if (f.beat || (typeof f.beats === 'number' && f.beats !== lastBeats)) pulse = 1
    if (typeof f.beats === 'number') lastBeats = f.beats
    pulse *= Math.exp(-dt * 6.5)
    const levels = new Float32Array(16)
    for (let i = 0; i < 16; i++) {
      let sum = 0
      for (let j = 0; j < 4; j++) sum += f.levels[i * 4 + j] || 0
      levels[i] = sum * 0.25
    }
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.BLEND)
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.enableVertexAttribArray(attr)
    gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0)
    gl.uniform2f(loc.uRes, f.pw, f.ph)
    gl.uniform3fv(loc.uTint, rgb(f.rgb, '255, 79, 154'))
    gl.uniform3fv(loc.uAccent, rgb(f.accentRgb, '89, 216, 255'))
    gl.uniform1f(loc.uTime, f.time % 1000)
    gl.uniform1f(loc.uBass, f.bass)
    gl.uniform1f(loc.uMid, f.mid)
    gl.uniform1f(loc.uHigh, f.high)
    gl.uniform1f(loc.uEnergy, f.energy)
    gl.uniform1f(loc.uBeat, f.playing ? pulse : 0)
    gl.uniform1fv(loc['uLevels[0]'], levels)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  },
})
