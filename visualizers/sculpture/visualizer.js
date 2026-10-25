// Sculpture: a marble bust in the dark, wound by a stone serpent. The light flashes on the
// beats, the camera cuts hard to a new shot every few beats and drifts slowly in between, like a
// music video shot on a set. Everything is drawn by one fragment shader (ray marching), no models.

const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uShot, uShotT, uFlash, uBass, uHigh, uLevel;
uniform vec3 uTint;

float hash(float n) { return fract(sin(n) * 43758.5453); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n = i.x + i.y * 57.0 + i.z * 113.0;
  return mix(mix(mix(hash(n), hash(n + 1.0), f.x), mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
             mix(mix(hash(n + 113.0), hash(n + 114.0), f.x), mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
}
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float smax(float a, float b, float k) { return -smin(-a, -b, k); }
float sdEll(vec3 p, vec3 r) { float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / k1; }
float sdCap(vec3 p, vec3 a, vec3 b, float r) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
float sdBox(vec3 p, vec3 b, float r) { vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }

// 1: stone of the bust, 2: serpent, 3: pedestal, 4: floor
vec2 map(vec3 p) {
  float chest = sdEll(p - vec3(0.0, -0.6, 0.0), vec3(0.62, 0.42, 0.34));
  vec3 sh = vec3(abs(p.x), p.yz);
  chest = smin(chest, sdEll(sh - vec3(0.42, -0.42, -0.02), vec3(0.34, 0.22, 0.26)), 0.15);
  chest = smax(chest, -(p.y + 0.95), 0.03);
  float neck = sdCap(p, vec3(0.0, -0.35, 0.0), vec3(0.0, 0.08, 0.03), 0.165);
  float head = sdEll(p - vec3(0.0, 0.36, 0.03), vec3(0.26, 0.33, 0.29));
  float jaw = sdEll(p - vec3(0.0, 0.17, 0.09), vec3(0.19, 0.15, 0.2));
  float nose = sdCap(p, vec3(0.0, 0.37, 0.28), vec3(0.0, 0.29, 0.315), 0.03);
  float brow = sdCap(sh, vec3(0.03, 0.44, 0.285), vec3(0.13, 0.435, 0.25), 0.03);
  float eyes = length(sh - vec3(0.092, 0.39, 0.335)) - 0.045;
  float hair = sdEll(p - vec3(0.0, 0.47, -0.03), vec3(0.29, 0.29, 0.31)) - 0.018 * sin(p.x * 38.0 + p.z * 9.0) * sin(p.y * 31.0) * sin(p.z * 33.0);
  hair = smax(hair, (p.z - 0.12) + (0.55 - p.y) * 0.5, 0.05);
  float bust = smin(chest, neck, 0.12);
  bust = smin(bust, head, 0.09);
  bust = smin(bust, jaw, 0.06);
  bust = smin(bust, nose, 0.03);
  bust = smin(bust, brow, 0.04);
  bust = smax(bust, -eyes, 0.03);
  bust = smin(bust, hair, 0.04);
  vec2 r = vec2(bust, 1.0);

  // the serpent: two turns around the bust, close at the neck, wide at the chest, thinning to
  // its tail; it turns slowly and swells with the bass
  float u = (atan(p.z, p.x) + uTime * 0.3) / 6.2831853;
  float pitch = 0.46;
  float y0 = p.y + 0.86;
  float k = clamp(floor(y0 / pitch - u + 0.5), 0.0, 1.0);
  float along = clamp((u + k + 0.5) / 2.0, 0.0, 1.0);
  float R = mix(0.78, 0.31, smoothstep(-0.65, -0.05, p.y)) + 0.03 * sin(u * 25.0 + uTime * 2.0);
  float tube = mix(0.075, 0.02, along) * (1.0 + 0.4 * uBass);
  float ring = length(vec2(length(p.xz) - R, y0 - (u + k) * pitch)) - tube;
  if (ring * 0.6 < r.x) r = vec2(ring * 0.6, 2.0);

  float ped = sdBox(p - vec3(0.0, -1.32, 0.0), vec3(0.6, 0.38, 0.6), 0.02);
  if (ped < r.x) r = vec2(ped, 3.0);
  float fl = p.y + 1.7;
  if (fl < r.x) r = vec2(fl, 4.0);
  return r;
}

vec3 normal(vec3 p) {
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(map(p + e.xyy).x - map(p - e.xyy).x, map(p + e.yxy).x - map(p - e.yxy).x, map(p + e.yyx).x - map(p - e.yyx).x));
}

float shadow(vec3 ro, vec3 rd) {
  float res = 1.0, t = 0.02;
  for (int i = 0; i < 24; i++) {
    float h = map(ro + rd * t).x;
    res = min(res, 10.0 * h / t);
    t += clamp(h, 0.02, 0.25);
    if (res < 0.01 || t > 4.0) break;
  }
  return clamp(res, 0.0, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  // the shot: angle, height, distance and look-at point from the shot number; a slow drift
  float s = uShot;
  float ang = (hash(s * 7.1) - 0.5) * 3.6 + uShotT * 0.05 * (hash(s * 3.3) - 0.5);
  float close = step(0.55, hash(s * 5.7));
  float dist = mix(4.2, 1.6, close) - uShotT * 0.06;
  float hgt = mix(-0.6, 0.9, hash(s * 9.2)) + mix(0.0, 0.3, close);
  vec3 target = vec3(0.0, mix(-0.35, 0.3, close), 0.0);
  vec3 ro = target + vec3(sin(ang) * dist, hgt, cos(ang) * dist);
  vec3 fw = normalize(target - ro);
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw));
  vec3 up = cross(fw, rt);
  float roll = (hash(s * 1.9) - 0.5) * 0.25;
  vec3 rd = normalize(fw * 1.9 + (rt * cos(roll) + up * sin(roll)) * uv.x + (up * cos(roll) - rt * sin(roll)) * uv.y);

  // key light: its side from the shot, a flash on every beat; a rim light in the visualizer colour
  vec3 key = normalize(vec3(hash(s * 4.4) * 2.0 - 1.0, 1.1, hash(s * 6.6) * 2.0 - 1.0));
  vec3 rim = normalize(vec3(-key.x, 0.4, -key.z));
  float keyI = 0.18 + uFlash * 2.8 + uLevel * 0.25;

  float t = 0.0;
  vec2 h = vec2(0.0);
  for (int i = 0; i < 90; i++) {
    h = map(ro + rd * t);
    if (h.x < 0.001 || t > 12.0) break;
    t += h.x;
  }
  vec3 col = vec3(0.0);
  if (t < 12.0) {
    vec3 p = ro + rd * t;
    vec3 n = normal(p);
    vec3 base = vec3(0.86, 0.84, 0.8);
    if (h.y < 1.5 || h.y > 2.5 && h.y < 3.5) {
      // marble: soft veins
      float v = noise(p * 3.0) * 0.6 + noise(p * 9.0) * 0.3;
      base *= 0.82 + 0.18 * smoothstep(0.35, 0.55, abs(sin(p.y * 6.0 + v * 7.0)));
      if (h.y > 2.5) base *= 0.55;
    } else if (h.y < 2.5) {
      base = vec3(0.32, 0.31, 0.3) * (0.8 + 0.4 * noise(p * 14.0));
    } else {
      base = vec3(0.04);
    }
    float dif = clamp(dot(n, key), 0.0, 1.0) * shadow(p + n * 0.01, key);
    float wrap = clamp(dot(n, key) * 0.5 + 0.5, 0.0, 1.0); // a little light through the stone
    float spe = pow(clamp(dot(reflect(rd, n), key), 0.0, 1.0), 24.0);
    float rimL = pow(clamp(1.0 + dot(n, rd), 0.0, 1.0), 3.0) * clamp(dot(n, rim) + 0.3, 0.0, 1.0);
    col = base * (dif * keyI + wrap * 0.04 * keyI + 0.012) + spe * 0.4 * keyI + uTint * rimL * (0.35 + uHigh * 1.2);
    // the floor fades into the dark
    col *= exp(-0.08 * t * t);
    // focus on the bust: what lies far before or behind it is softened into the dark
    col *= mix(1.0, 0.45, smoothstep(0.6, 3.0, abs(t - length(target - ro))));
  }
  // haze in the key light, lit by the flash
  col += uTint * 0.012 * (0.3 + uFlash) * exp(-dot(uv, uv) * 2.0);
  col += vec3(1.0) * 0.04 * uFlash * exp(-dot(uv, uv) * 4.0);
  // vignette and film grain
  col *= 1.0 - 0.55 * dot(uv, uv);
  col += (hash(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime) - 0.5) * 0.012;
  gl_FragColor = vec4(pow(max(col, 0.0), vec3(0.4545)), 1.0);
}`

let prog = null
let buf = null
let loc = {}
let shot = 1
let shotAt = 0
let flash = 0
let lastBeats = 0
let lastTime = 0

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader')
  return s
}

function rgb(str) {
  const [r, g, b] = String(str || '255, 255, 255').split(',').map((v) => Number(v) / 255)
  return [Number.isFinite(r) ? r : 1, Number.isFinite(g) ? g : 1, Number.isFinite(b) ? b : 1]
}

parrotify.register({
  webgl: true,
  maxPixelRatio: 0.75,
  color: '#d8c8a8',
  init(gl) {
    prog = gl.createProgram()
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link')
    buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    for (const u of ['uRes', 'uTime', 'uShot', 'uShotT', 'uFlash', 'uBass', 'uHigh', 'uLevel', 'uTint']) loc[u] = gl.getUniformLocation(prog, u)
    loc.p = gl.getAttribLocation(prog, 'p')
  },
  draw(gl, f) {
    const dt = Math.min(0.1, Math.max(0, f.time - (lastTime || f.time)))
    lastTime = f.time
    // a beat flashes the light; every fourth beat (at most every 1.5 s) cuts to a new shot, and
    // without beats the shot changes every 8 s
    if (f.beats !== lastBeats) {
      lastBeats = f.beats
      flash = 1
      if (f.beats % 4 === 0 && f.time - shotAt > 1.5) {
        shot++
        shotAt = f.time
      }
    }
    if (f.time - shotAt > 8) {
      shot++
      shotAt = f.time
    }
    flash *= Math.exp(-dt * 7)
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.enableVertexAttribArray(loc.p)
    gl.vertexAttribPointer(loc.p, 2, gl.FLOAT, false, 0, 0)
    gl.uniform2f(loc.uRes, f.pw, f.ph)
    gl.uniform1f(loc.uTime, f.time % 1000)
    gl.uniform1f(loc.uShot, shot % 997)
    gl.uniform1f(loc.uShotT, f.time - shotAt)
    gl.uniform1f(loc.uFlash, f.playing ? flash : 0)
    gl.uniform1f(loc.uBass, f.bass)
    gl.uniform1f(loc.uHigh, f.high)
    gl.uniform1f(loc.uLevel, f.energy)
    gl.uniform3fv(loc.uTint, rgb(f.rgb))
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  },
})
