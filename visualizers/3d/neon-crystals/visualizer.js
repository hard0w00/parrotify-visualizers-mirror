const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uBass, uMid, uHigh, uEnergy, uBeat;
uniform float uLevels[7];
uniform vec3 uTint, uAccent;
#define FAR 32.0

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float crystal(vec3 p, float r, float h) {
  vec2 a = abs(p.xz);
  float radial = max(a.y, dot(a, vec2(0.8660254, 0.5)));
  float body = max(radial - r, abs(p.y) - h * 0.62);
  float tip = max(radial + (abs(p.y) - h * 0.62) * r / (h * 0.38) - r, abs(p.y) - h);
  return max(body, tip) * 0.72;
}
vec2 scene(vec3 p) {
  float d = p.y + 2.0;
  float id = 9.0;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float angle = fi * 2.39996 + uTime * (0.07 + fi * 0.006);
    float radius = i == 0 ? 0.0 : 1.85 + 0.25 * sin(fi * 4.0);
    float level = uLevels[i];
    float h = 0.68 + level * 0.8 + (i == 0 ? 0.8 : 0.0);
    vec3 c = p - vec3(cos(angle) * radius, (i == 0 ? 0.15 : -0.15) + sin(angle * 1.7 + fi) * 0.32, sin(angle) * radius);
    c.xz = rot(-angle + uTime * 0.12) * c.xz;
    c.xy = rot(sin(fi * 8.0) * 0.14) * c.xy;
    float cd = crystal(c, 0.25 + (i == 0 ? 0.2 : 0.0), h);
    if (cd < d) { d = cd; id = fi; }
  }
  return vec2(d, id);
}
vec3 normal(vec3 p) {
  vec2 e = vec2(0.002, 0.0);
  return normalize(vec3(scene(p + e.xyy).x - scene(p - e.xyy).x,
    scene(p + e.yxy).x - scene(p - e.yxy).x,
    scene(p + e.yyx).x - scene(p - e.yyx).x));
}
vec3 palette(float id) {
  float k = 0.5 + 0.5 * sin(id * 2.1);
  return mix(uTint, uAccent, k * 0.72);
}
vec3 environment(vec3 r) {
  float horizon = pow(max(0.0, 1.0 - abs(r.y + 0.08)), 7.0);
  float strip = pow(max(0.0, sin(atan(r.z, r.x) * 6.0 + uTime * 0.15)), 38.0) * horizon;
  return vec3(0.003, 0.004, 0.012) + uTint * horizon * 0.055 + mix(uTint, uAccent, 0.5) * strip * 0.6;
}
vec3 shadeCrystal(vec3 p, vec3 rd, float id, float depth) {
  vec3 n = normal(p);
  vec3 neon = palette(id);
  vec3 light = normalize(vec3(-0.6, 0.8, 0.45));
  float fres = pow(1.0 - max(dot(n, -rd), 0.0), 2.2);
  float spec = pow(max(dot(reflect(-light, n), -rd), 0.0), 72.0);
  float edge = pow(1.0 - abs(dot(n, -rd)), 5.0);
  float bands = pow(0.5 + 0.5 * sin(p.y * 15.0 - uTime * 4.0 + id), 12.0);
  vec3 col = neon * (0.12 + fres * 1.1 + edge * (0.5 + uHigh));
  col += environment(reflect(rd, n)) * 1.5 + vec3(1.0) * spec * 2.5;
  col += mix(neon, vec3(1.0), 0.65) * bands * (0.08 + uEnergy * 0.3 + uBeat * 0.35);
  return mix(col, environment(rd), 1.0 - exp(-depth * 0.018));
}
void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uRes.xy) / uRes.y;
  float angle = 0.58 + uTime * 0.075;
  vec3 ro = vec3(cos(angle) * (7.4 - uBass * 0.35), 2.6 + sin(uTime * 0.21) * 0.35, sin(angle) * (7.4 - uBass * 0.35));
  vec3 ta = vec3(0.0, -0.05, 0.0);
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw));
  vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * 1.65 + rt * uv.x + up * uv.y);
  float travel = 0.0, id = -1.0, aura = 0.0;
  for (int i = 0; i < 58; i++) {
    vec2 h = scene(ro + rd * travel);
    aura += exp(-9.0 * max(h.x, 0.0)) * 0.009 * step(h.y, 8.5);
    if (h.x < 0.002 || travel > FAR) break;
    travel += h.x * 0.78;
  }
  vec3 col = environment(rd);
  if (travel < FAR) {
    vec3 p = ro + rd * travel;
    if (id < 8.5) {
      col = shadeCrystal(p, rd, id, travel);
    } else {
      vec3 n = vec3(0.0, 1.0, 0.0);
      vec2 grid = abs(fract(p.xz * 0.5) - 0.5);
      float line = 1.0 - smoothstep(0.008, 0.025, min(grid.x, grid.y));
      vec3 rr = reflect(rd, n);
      float rtvl = 0.03, rid = -1.0;
      vec3 reflected = environment(rr);
      for (int j = 0; j < 24; j++) {
        vec2 h = scene(p + rr * rtvl);
        if (h.x < 0.006 || rtvl > 18.0) { rid = h.y; break; }
        rtvl += h.x * 0.85;
      }
      if (rid >= 0.0 && rid < 8.5 && rtvl < 18.0) reflected = palette(rid) * (0.18 + uEnergy * 0.35) + environment(rr);
      float fade = exp(-travel * 0.085);
      col = vec3(0.004, 0.006, 0.014) + reflected * (0.26 + fade * 0.25);
      col += uTint * line * fade * (0.13 + uBeat * 0.25);
      float ring = exp(-abs(length(p.xz) - (1.0 + (1.0 - uBeat) * 7.0)) * 5.0) * uBeat;
      col += uAccent * ring * 0.3;
    }
  }
  col += mix(uTint, uAccent, 0.4) * aura * (0.3 + uEnergy * 0.75);
  col *= 1.0 - 0.23 * dot(uv * 0.53, uv * 0.53);
  col = col / (col + vec3(0.68));
  gl_FragColor = vec4(pow(col, vec3(0.4545)), 1.0);
}
`

let gl, program, buffer, loc
let lastTime = 0
let pulse = 0
let bass = 0
let energy = 0
const levels = new Float32Array(7)

function compile(type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed')
  return shader
}

function rgb(value, fallback) {
  const parts = String(value || fallback).split(',').map((v) => Math.max(0, Math.min(1, Number(v) / 255 || 0)))
  return parts.length === 3 ? parts : [0.2, 0.9, 1]
}

parrotify.register({
  webgl: true,
  maxPixelRatio: 0.75,
  color: '#28e7ff',
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
    for (const name of ['uRes', 'uTime', 'uBass', 'uMid', 'uHigh', 'uEnergy', 'uBeat', 'uTint', 'uAccent', 'uLevels[0]']) loc[name] = gl.getUniformLocation(program, name)
  },
  draw(g, f) {
    const dt = Math.min(0.1, Math.max(0, f.time - (lastTime || f.time)))
    lastTime = f.time
    pulse = f.beat ? 1 : pulse * Math.exp(-dt * 4.8)
    bass += (f.bass - bass) * Math.min(1, dt * 7)
    energy += (f.energy - energy) * Math.min(1, dt * 5)
    for (let i = 0; i < 7; i++) {
      const target = f.levels[Math.min(63, i * 9)] || 0
      levels[i] += (target - levels[i]) * Math.min(1, dt * 10)
    }
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
    gl.uniform1f(loc.uBass, bass)
    gl.uniform1f(loc.uMid, f.mid)
    gl.uniform1f(loc.uHigh, f.high)
    gl.uniform1f(loc.uEnergy, energy)
    gl.uniform1f(loc.uBeat, f.playing ? pulse : 0)
    gl.uniform3fv(loc.uTint, rgb(f.rgb, '40, 231, 255'))
    gl.uniform3fv(loc.uAccent, rgb(f.accentRgb, '255, 45, 190'))
    gl.uniform1fv(loc['uLevels[0]'], levels)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  },
})
