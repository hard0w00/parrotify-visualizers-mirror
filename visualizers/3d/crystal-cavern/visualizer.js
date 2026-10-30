const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos; gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime, uBass, uMid, uHigh, uEnergy, uBeat;
uniform vec3 uTint, uAccent;
#define FAR 34.0

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float crystal(vec3 p, float r, float h) {
  vec2 a = abs(p.xz);
  float radial = max(a.y, dot(a, vec2(0.8660254, 0.5)));
  float body = max(radial - r, abs(p.y) - h * 0.62);
  float tip = max(radial + (abs(p.y) - h * 0.62) * r / (h * 0.38) - r, abs(p.y) - h);
  return max(body, tip) * 0.72;
}
vec2 scene(vec3 p) {
  float d = p.y + 2.05 + sin(p.x * 2.1 + p.z) * 0.035;
  float id = 2.0;
  float cell = floor((p.z + 3.0) / 6.0);
  vec3 q = p;
  q.z = mod(p.z + 3.0, 6.0) - 3.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float side = mod(fi, 2.0) < 0.5 ? -1.0 : 1.0;
    float rnd = hash(cell * 7.0 + fi * 13.0);
    float h = 1.2 + rnd * 1.65;
    vec3 c = q - vec3(side * (2.25 + hash(fi + cell) * 0.75), -2.0 + h, (hash(fi * 3.7 + cell) - 0.5) * 4.2);
    c.xz = rot(rnd * 2.0) * c.xz;
    c.xy = rot(side * (0.08 + rnd * 0.18)) * c.xy;
    float cd = crystal(c, 0.28 + rnd * 0.25, h);
    if (cd < d) { d = cd; id = 1.0; }
  }
  vec3 c = q - vec3(sin(cell * 2.3) * 0.65, 3.35, 0.5);
  c.y = -c.y;
  c.xz = rot(cell) * c.xz;
  float cd = crystal(c, 0.42, 1.75);
  if (cd < d) { d = cd; id = 1.0; }
  return vec2(d, id);
}
vec3 normal(vec3 p) {
  vec2 e = vec2(0.0025, 0.0);
  return normalize(vec3(scene(p + e.xyy).x - scene(p - e.xyy).x,
    scene(p + e.yxy).x - scene(p - e.yxy).x,
    scene(p + e.yyx).x - scene(p - e.yyx).x));
}
vec3 environment(vec3 r) {
  float horizon = pow(max(0.0, 1.0 - abs(r.y)), 5.0);
  float lamp = pow(max(dot(r, normalize(vec3(-0.4, 0.5, 0.75))), 0.0), 48.0);
  return vec3(0.006, 0.009, 0.022) + uTint * horizon * 0.09 + vec3(0.75, 0.9, 1.0) * lamp;
}
void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uRes.xy) / uRes.y;
  float t = uTime * (0.30 + uBass * 0.12);
  vec3 ro = vec3(sin(t * 0.7) * 0.48, 0.12 + sin(t * 0.9) * 0.18, t);
  vec3 ta = ro + vec3(sin(t * 0.35) * 0.28, -0.04 + uMid * 0.05, 3.5);
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw));
  vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * 1.55 + rt * uv.x + up * uv.y);
  float travel = 0.0, id = 0.0, glow = 0.0;
  for (int i = 0; i < 64; i++) {
    vec2 h = scene(ro + rd * travel);
    glow += exp(-7.0 * max(h.x, 0.0)) * 0.012 * step(h.y, 1.5);
    if (h.x < 0.0025 || travel > FAR) break;
    travel += h.x * 0.72;
  }
  vec3 col = environment(rd);
  if (travel < FAR) {
    vec3 p = ro + rd * travel, n = normal(p);
    vec3 light = normalize(vec3(-0.5, 0.75, 0.35));
    float dif = max(dot(n, light), 0.0);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    float spec = pow(max(dot(reflect(-light, n), -rd), 0.0), 54.0);
    if (id < 1.5) {
      float strata = 0.5 + 0.5 * sin(p.y * 8.0 + p.x * 3.0);
      vec3 base = mix(uTint * 0.14, uAccent * 0.32, strata * 0.4 + uHigh * 0.25);
      col = base * (0.3 + dif * 0.85) + environment(reflect(rd, n)) * (0.8 + fres * 2.0);
      col += uTint * fres * (0.35 + uEnergy * 0.65) + vec3(1.0) * spec * 1.8;
      col += uAccent * uBeat * 0.28;
    } else {
      float veins = pow(0.5 + 0.5 * sin(p.x * 5.0 + sin(p.z * 2.0)), 12.0);
      col = vec3(0.009, 0.013, 0.025) * (0.5 + dif) + uTint * veins * (0.025 + uBeat * 0.1);
      col += environment(reflect(rd, n)) * 0.3;
    }
    col = mix(col, environment(rd), 1.0 - exp(-travel * travel * 0.0018));
  }
  col += uTint * glow * (0.22 + uEnergy * 0.65 + uBeat * 0.35);
  float vignette = 1.0 - 0.24 * dot(uv * 0.55, uv * 0.55);
  col *= vignette;
  col = col / (col + vec3(0.72));
  gl_FragColor = vec4(pow(col, vec3(0.4545)), 1.0);
}
`

let gl, program, buffer, loc
let lastTime = 0
let pulse = 0
let smoothBass = 0
let smoothEnergy = 0

function compile(type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed')
  return shader
}

function rgb(value, fallback) {
  const parts = String(value || fallback).split(',').map((v) => Math.max(0, Math.min(1, Number(v) / 255 || 0)))
  return parts.length === 3 ? parts : [0.4, 0.8, 1]
}

parrotify.register({
  webgl: true,
  maxPixelRatio: 0.75,
  color: '#62cfff',
  init(context) {
    gl = context
    program = gl.createProgram()
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Shader link failed')
    buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    loc = {}
    for (const name of ['uRes', 'uTime', 'uBass', 'uMid', 'uHigh', 'uEnergy', 'uBeat', 'uTint', 'uAccent']) loc[name] = gl.getUniformLocation(program, name)
  },
  draw(g, f) {
    const dt = Math.min(0.1, Math.max(0, f.time - (lastTime || f.time)))
    lastTime = f.time
    pulse = f.beat ? 1 : pulse * Math.exp(-dt * 5.5)
    smoothBass += (f.bass - smoothBass) * Math.min(1, dt * 8)
    smoothEnergy += (f.energy - smoothEnergy) * Math.min(1, dt * 5)
    gl.viewport(0, 0, f.pw, f.ph)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.BLEND)
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    const a = gl.getAttribLocation(program, 'aPos')
    gl.enableVertexAttribArray(a)
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0)
    gl.uniform2f(loc.uRes, f.pw, f.ph)
    gl.uniform1f(loc.uTime, f.time)
    gl.uniform1f(loc.uBass, smoothBass)
    gl.uniform1f(loc.uMid, f.mid)
    gl.uniform1f(loc.uHigh, f.high)
    gl.uniform1f(loc.uEnergy, smoothEnergy)
    gl.uniform1f(loc.uBeat, f.playing ? pulse : 0)
    gl.uniform3fv(loc.uTint, rgb(f.rgb, '98, 207, 255'))
    gl.uniform3fv(loc.uAccent, rgb(f.accentRgb, '174, 104, 255'))
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  },
})
