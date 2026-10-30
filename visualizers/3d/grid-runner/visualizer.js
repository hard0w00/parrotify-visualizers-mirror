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

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float line(float x, float w) { return 1.0 - smoothstep(w, w * 2.0, abs(fract(x) - 0.5)); }
vec3 finish(vec3 col, vec2 p) {
  col = col / (col + vec3(0.78));
  col = pow(max(col, 0.0), vec3(0.4545));
  col *= 1.0 - 0.27 * dot(p * vec2(0.48, 0.76), p * vec2(0.48, 0.76));
  col += (hash(gl_FragCoord.xy + fract(uTime) * 43.0) - 0.5) / 255.0;
  return col;
}
void main() {
  vec2 p = vec2(vUv.x * uRes.x / max(uRes.y, 1.0), vUv.y);
  float bank = sin(uTime * 0.7) * (0.012 + uMid * 0.02) + sin(uTime * 0.17) * 0.02;
  p = mat2(cos(bank), -sin(bank), sin(bank), cos(bank)) * p;
  float horizon = 0.10 + sin(uTime * 0.9) * 0.008 * (0.3 + uBass);
  vec3 cyan = mix(vec3(0.02, 0.75, 1.0), uTint, 0.2);
  vec3 pink = mix(vec3(1.0, 0.025, 0.42), uAccent, 0.18);
  vec3 col = mix(vec3(0.008, 0.008, 0.03), vec3(0.035, 0.005, 0.075), smoothstep(1.0, -0.4, p.y));
  float haze = exp(-abs(p.y - horizon) * 7.0) * exp(-abs(p.x) * 0.45);
  col += mix(pink, cyan, 0.45) * haze * (0.2 + uEnergy * 0.25);

  vec2 portalP = (p - vec2(0.0, horizon + 0.09)) * vec2(0.82, 1.0);
  float portalD = length(portalP);
  float portal = exp(-abs(portalD - 0.19) * 130.0) + exp(-abs(portalD - 0.25) * 180.0) * 0.45;
  col += mix(cyan, pink, smoothstep(-0.2, 0.2, p.x)) * portal * (0.5 + uBeat * 1.3);
  col += pink * exp(-portalD * 12.0) * (0.18 + uBeat * 0.2);

  vec2 speedCell = floor((p + vec2(0.0, uTime * 0.7)) * vec2(42.0, 18.0));
  float sr = hash(speedCell);
  float streak = smoothstep(0.035, 0.0, abs(fract(p.x * 42.0) - 0.5)) * step(0.965, sr);
  streak *= smoothstep(0.25, 0.8, abs(p.x)) * smoothstep(horizon, 0.65, p.y);
  col += cyan * streak * (0.08 + uHigh * 0.65);

  vec3 ro = vec3(sin(uTime * 0.43) * (0.15 + uBass * 0.2), 1.15 + uBass * 0.18 + uBeat * 0.08, 0.0);
  vec3 rd = normalize(vec3(p.x, (p.y - horizon) * 1.12, -1.55 - uBeat * 0.06));
  float floorT = rd.y < -0.0001 ? -ro.y / rd.y : 1000.0;
  float wallT = 1000.0;
  float wallSide = 1.0;
  if (abs(rd.x) > 0.0001) {
    wallSide = rd.x > 0.0 ? 1.0 : -1.0;
    wallT = (wallSide * 4.1 - ro.x) / rd.x;
  }
  if (floorT > 0.0 && floorT < wallT) {
    vec3 pos = ro + rd * floorT;
    pos.z += uTime * (7.0 + uEnergy * 5.0);
    float w = 0.012 + floorT * 0.00065;
    float gx = line(pos.x * 0.5, w);
    float gz = line(pos.z * 0.5, w);
    float fade = exp(-floorT * 0.025);
    col = vec3(0.008, 0.012, 0.028) + vec3(0.018, 0.005, 0.035) * fade;
    col += (cyan * gx * 0.55 + pink * gz * 0.85) * fade * (0.65 + uEnergy * 0.85);
    float lane = exp(-abs(abs(pos.x) - 2.25) * 12.0) * fade;
    col += cyan * lane * (1.2 + uBeat * 1.2);
    float dash = step(0.52, fract(pos.z * 0.18)) * exp(-abs(pos.x) * 7.0) * fade;
    col += vec3(0.65, 0.85, 1.0) * dash * 0.8;
    float chevronZ = abs(fract(pos.z * 0.09 - uTime * 0.04) - 0.5);
    float chevron = exp(-abs(chevronZ - abs(pos.x) * 0.025) * 95.0);
    chevron *= (1.0 - smoothstep(0.5, 1.6, abs(pos.x))) * step(0.5, fract(pos.z * 0.045));
    col += pink * chevron * fade * (0.25 + uLevels[7] * 1.5 + uBeat);
    float ripple = exp(-abs(fract(pos.z * 0.06 - uTime * 0.3) - 0.5) * 38.0);
    col += cyan * ripple * fade * uBeat * 0.8;
  } else if (wallT > 0.0 && wallT < 900.0) {
    vec3 pos = ro + rd * wallT;
    pos.z += uTime * (7.0 + uEnergy * 5.0);
    float cell = floor(pos.z * 0.24);
    float building = 1.3 + hash(vec2(cell, wallSide)) * 3.8 + uLevels[3] * 0.7;
    float fade = exp(-wallT * 0.027);
    if (pos.y < building && pos.y > -0.15) {
      vec2 wuv = vec2(pos.z * 0.5, pos.y * 0.5);
      float grid = max(line(wuv.x, 0.018 + wallT * 0.0005), line(wuv.y, 0.018 + wallT * 0.0005));
      vec2 win = fract(vec2(pos.z * 0.72, pos.y * 0.85));
      float windows = step(0.2, win.x) * step(win.x, 0.72) * step(0.22, win.y) * step(win.y, 0.64);
      windows *= step(0.47, hash(floor(vec2(pos.z * 0.72, pos.y * 0.85)) + wallSide));
      col = vec3(0.012, 0.009, 0.035) * (0.5 + fade);
      col += mix(cyan, pink, hash(vec2(cell, 4.0))) * grid * fade * 0.7;
      col += mix(pink, cyan, hash(vec2(cell, 8.0))) * windows * fade * (0.12 + uHigh * 0.75);
      float crown = exp(-abs(pos.y - building) * 20.0);
      col += pink * crown * fade * (0.8 + uBeat);
    }
  }
  float scan = 0.97 + 0.03 * sin(gl_FragCoord.y * 2.2 + uTime * 5.0);
  col *= scan;
  col += mix(cyan, pink, 0.5) * uBeat * 0.025;
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
  color: '#39d9ff',
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
    pulse *= Math.exp(-dt * 7.5)
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
    gl.uniform3fv(loc.uTint, rgb(f.rgb, '57, 217, 255'))
    gl.uniform3fv(loc.uAccent, rgb(f.accentRgb, '255, 55, 154'))
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
