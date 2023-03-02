const segment_t = (x0, y0, z0, x1, y1, z1) => ({
    x0, y0, z0,
    x1, y1, z1,
    dirx: x1 - x0, diry: y1 - y0, dirz: z1 - z0,

    calculateDir() {
        this.dirx = this.x1 - this.x0
        this.diry = this.y1 - this.y0
        this.dirz = this.z1 - this.z0
    },

    // Determina si el punto dado por las coordenadas se encuentra a la derecha de este segment
    isInFront(x, y) {
        const dx = x - this.x0,
            dy = y - this.y0
        return this.dirx * dy - this.diry * dx > 0
    },

    length() {
        return Math.sqrt(this.dirx * this.dirx + this.diry * this.diry + this.dirz * this.dirz)
    }
})

const triangle_t = (p0, p1, p2) => {
    const x0 = p0.x, y0 = p0.y, z0 = p0.z,
          x1 = p1.x, y1 = p1.y, z1 = p1.z,
          x2 = p2.x, y2 = p2.y, z2 = p2.z
    const ux = x1 - x0,
          uy = y1 - y0,
          uz = z1 - z0
    const vx = x2 - x0,
          vy = y2 - y0,
          vz = z2 - z0
    const nx = uy * vz - uz * vy,
          ny = uz * vx - ux * vz,
          nz = ux * vy - uy * vx
    return {
        x0, y0, z0, // V0
        x1, y1, z1, // V1
        x2, y2, z2, // V2
        ux, uy, uz, // u
        vx, vy, vz, // v
        nx, ny, nz, // n = u x v

        isInFront(x, y, z) {
            return this.nx * (x - this.x0) + this.ny * (y - this.y0) + this.nz * (z - this.z0) > 0 // dot product
        },

        invertN() {
            this.nx = -this.nx
            this.ny = -this.ny
            this.nz = -this.nz
            return this
        }
    }
}

/**
 * Calcula si hubo intersección entre los dos segmentos.
 * Retorna t, si t = -1 => no hay intersección
 * */
function Segment_Segment(p, q) {
    let cross = p.dirx * q.diry - p.diry * q.dirx

    if (cross !== 0) {
        cross = 1 / cross
        const dx = (q.x0 - p.x0) * cross,
              dy = (q.y0 - p.y0) * cross
        const t = dx * q.diry - dy * q.dirx
        const u = dx * p.diry - dy * p.dirx
        if (t > 0 && u > 0 && u < 1)
            return t
    }
    return -1
}

/**
 * Hace intersección entre el segmento y el Triángulo.
 * Retorna r: el parámetro del Segmento. Si r = -1 => no hay itersección
 * */
function Segment_Triangle(S, T) {
    const w0x = S.x0 - T.x0,
          w0y = S.y0 - T.y0,
          w0z = S.z0 - T.z0
    const a = -(T.nx * w0x + T.ny * w0y + T.nz * w0z), // a = -(n dot w0)
        b = T.nx * S.dirx + T.ny * S.diry + T.nz * S.dirz // b = n dot dir

    // El segmento es paralelo al plano del Triángulo
    if (Math.abs(b) < 1e-5) return -1

    // Obtener le punto de intersección del Segmento con el plano del Triángulo
    const r = a / b
    if (r < 0) // El Segmento se aleja del Triángulo o no lo alcanza
        return -1       // => no hay intersección

    // Punto de intersección entre el Segmento y el Plano
    const Ix = S.x0 + r * S.dirx,
          Iy = S.y0 + r * S.diry,
          Iz = S.z0 + r * S.dirz

    // ¿I está dentro de T?
    const uu = T.ux * T.ux + T.uy * T.uy + T.uz * T.uz,
          uv = T.ux * T.vx + T.uy * T.vy + T.uz * T.vz,
          vv = T.vx * T.vx + T.vy * T.vy + T.vz * T.vz
    const wx = Ix - T.x0,
          wy = Iy - T.y0,
          wz = Iz - T.z0
    const wu = wx * T.ux + wy * T.uy + wz * T.uz,
          wv = wx * T.vx + wy * T.vy + wz * T.vz
    const D = 1 / (uv * uv - uu * vv)

    // Obtener y verificar las coordenadas paramétricas
    const s = (uv * wv - vv * wu) * D,
          t = (uv * wu - uu * wv) * D
    return (s >= 0 && s <= 1 && t >= 0 && (s + t) <= 1)
        ? r  // I está dentro de T
        : -1 // I está fuera de T
}