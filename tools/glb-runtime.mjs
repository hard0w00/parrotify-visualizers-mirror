export function parseGLB(buf) {
  const dv = new DataView(buf)
  if (dv.getUint32(0, true) !== 0x46546c67) return Promise.reject(new Error('not a GLB'))
  const jsonLen = dv.getUint32(12, true)
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen)))
  const binStart = 20 + jsonLen + 8
  const sizes = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }
  const types = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }
  function view(i) { const v = json.bufferViews[i]; return { off: binStart + (v.byteOffset || 0), len: v.byteLength, stride: v.byteStride || 0 } }
  function accessor(i) {
    const a = json.accessors[i], v = view(a.bufferView), T = types[a.componentType], n = sizes[a.type]
    const out = new T(a.count * n), el = T.BYTES_PER_ELEMENT, stride = v.stride || n * el, base = v.off + (a.byteOffset || 0)
    if (stride === n * el && base % el === 0) return new T(buf.slice(base, base + a.count * n * el))
    const src = new DataView(buf)
    let get = { 1: 'getInt8', 2: 'getUint16', 4: T === Float32Array ? 'getFloat32' : 'getUint32' }[el]
    if (T === Int8Array) get = 'getInt8'; if (T === Uint8Array) get = 'getUint8'; if (T === Int16Array) get = 'getInt16'
    for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) out[k * n + c] = src[get](base + k * stride + c * el, true)
    return out
  }
  function image(i) {
    const img = json.images[i], v = view(img.bufferView)
    return createImageBitmap(new Blob([buf.slice(v.off, v.off + v.len)], { type: img.mimeType || 'image/png' })).catch(() => null)
  }
  function mat4(n) {
    if (n.matrix) return n.matrix.slice()
    const t = n.translation || [0, 0, 0], r = n.rotation || [0, 0, 0, 1], s = n.scale || [1, 1, 1]
    const x = r[0], y = r[1], z = r[2], w = r[3]
    return [(1 - 2 * (y * y + z * z)) * s[0], 2 * (x * y + z * w) * s[0], 2 * (x * z - y * w) * s[0], 0,
      2 * (x * y - z * w) * s[1], (1 - 2 * (x * x + z * z)) * s[1], 2 * (y * z + x * w) * s[1], 0,
      2 * (x * z + y * w) * s[2], 2 * (y * z - x * w) * s[2], (1 - 2 * (x * x + y * y)) * s[2], 0, t[0], t[1], t[2], 1]
  }
  function mul(a, b) { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let v = 0; for (let k = 0; k < 4; k++) v += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = v } return o }
  const meshes = [], waits = [], min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  function visit(ni, parent) {
    const node = json.nodes[ni], m = mul(parent, mat4(node))
    if (node.mesh != null) json.meshes[node.mesh].primitives.forEach((p) => {
      if (p.mode != null && p.mode !== 4) return
      const pos = accessor(p.attributes.POSITION), nor = p.attributes.NORMAL != null ? accessor(p.attributes.NORMAL) : null
      for (let k = 0; k < pos.length; k += 3) {
        let x = pos[k], y = pos[k + 1], z = pos[k + 2]
        pos[k] = m[0] * x + m[4] * y + m[8] * z + m[12]; pos[k + 1] = m[1] * x + m[5] * y + m[9] * z + m[13]; pos[k + 2] = m[2] * x + m[6] * y + m[10] * z + m[14]
        for (let c = 0; c < 3; c++) { min[c] = Math.min(min[c], pos[k + c]); max[c] = Math.max(max[c], pos[k + c]) }
        if (nor) { x = nor[k]; y = nor[k + 1]; z = nor[k + 2]
          const nx = m[0] * x + m[4] * y + m[8] * z, ny = m[1] * x + m[5] * y + m[9] * z, nz = m[2] * x + m[6] * y + m[10] * z, l = Math.hypot(nx, ny, nz) || 1
          nor[k] = nx / l; nor[k + 1] = ny / l; nor[k + 2] = nz / l }
      }
      const mat = p.material != null ? json.materials[p.material] : {}, pbr = mat.pbrMetallicRoughness || {}
      const mesh = { position: pos, normal: nor, uv: p.attributes.TEXCOORD_0 != null ? accessor(p.attributes.TEXCOORD_0) : null,
        indices: p.indices != null ? accessor(p.indices) : null, color: pbr.baseColorFactor || [1, 1, 1, 1], texture: null }
      const tex = pbr.baseColorTexture && json.textures[pbr.baseColorTexture.index]
      if (tex && tex.source != null) waits.push(image(tex.source).then((bmp) => { mesh.texture = bmp }))
      meshes.push(mesh)
    })
    ;(node.children || []).forEach((c) => visit(c, m))
  }
  const scene = json.scenes[json.scene || 0]
  scene.nodes.forEach((n) => visit(n, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]))
  return Promise.all(waits).then(() => ({ meshes, min, max }))
}
