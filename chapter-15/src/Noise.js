const Noise = {
    hash: (() => {
        const h = new Array(256).fill(0).map((_, i) => i).sort(() => Math.random() - .5)
        return new Uint8Array(512).fill(0).map((_, i) => h[i & 255])
    })(),
    hashMask: 255,
    invHashMask: 1 / 255,

    gradients1D: [1, -1],
    gradientsMask1D: 1,

    gradients2Dx: new Float64Array([
        1, -1, 0, 0, Math.SQRT1_2, -Math.SQRT1_2, Math.SQRT1_2, -Math.SQRT1_2
    ]),
    gradients2Dy: new Float64Array([
        0, 0, 1, -1, Math.SQRT1_2, Math.SQRT1_2, -Math.SQRT1_2, -Math.SQRT1_2
    ]),
    gradientsMask2D: 7,

    gradients3Dx: new Int8Array([
        1, -1, 1, -1, 1, -1, 1, -1, 0, 0, 0, 0, 1, -1, 0, 0
    ]),
    gradients3Dy: new Int8Array([
        1, 1, -1, -1, 0, 0, 0, 0, 1, -1, 1, -1, 1, 1, -1, -1
    ]),
    gradients3Dz: new Int8Array([
        0, 0, 0, 0, 1, 1, -1, -1, 1, 1, -1, -1, 0, 0, 1, -1
    ]),
	gradientsMask3D: 15,

    smooth: t => t * t * t * (t * (t * 6 - 15) + 10),
    smoothDerivative: t => 30 *t * t * (t * (t - 2) + 1),

    createDefaultOptions: () => ({
        frequency: 3,
        octaves: 3,
        lacunarity: 2,    // Cambio en la frecuencia por cada octava
        persistence: 0.5, // Cambio en la amplitud por cada octava
        method: Noise.perlin2D,
        withDerivative: true,
    }),

    createSample: () => ({
        value: 0,
        derivative: v3(0,0,0)
    }),

    createNoise(options) {
        const range = new Array(options.octaves).fill(0).map((_,i) => options.persistence ** i).reduce((acc, x) => acc + x, 0)
        const method = options.method.name + (options.withDerivative ? "withDerivative" : "")
        return eval(`(point, sample) => {
            sample.value = 0
            ${options.withDerivative ? `
            sample.derivative.x = sample.derivative.y = sample.derivative.z = 0
            ` : ""}
            ${new Array(options.octaves).fill(0).map((_,i) => `
            this.${method}(point, ${options.frequency * (options.lacunarity ** i)}, ${options.persistence ** i}, sample)
            `).join("")}
            sample.value *= ${1/range}
            ${options.withDerivative ? `
            sample.derivative.x *= ${1/range}
            sample.derivative.y *= ${1/range}
            sample.derivative.z *= ${1/range}
            ` : ""}
            ${[this.perlin1D, this.perlin2D, this.perlin3D].includes(options.method) ?
            `sample.value = sample.value * .5 + .5
            sample.derivative.x = sample.derivative.x * .5 + .5
            sample.derivative.y = sample.derivative.y * .5 + .5
            sample.derivative.z = sample.derivative.z * .5 + .5` : ""}
        }`).bind(this)
    },

    value1D(point, frequency, amplitude, sample) {
        const x = point.x * frequency
        const i = Math.floor(x) & this.hashMask
        const t = this.smooth(x - Math.floor(x))

        sample.value += (
            this.hash[i] * (1 - t) +
            this.hash[i+1] * t
        ) * this.invHashMask * amplitude
    },

    value1DwithDerivative(point, frequency, amplitude, sample) {
        const x = point.x * frequency
        let i = Math.floor(x) & this.hashMask
        let t = x - Math.floor(x)

        const dt = this.smoothDerivative(t)
        t = this.smooth(t)

        const a = this.hash[i],
              b = this.hash[i+1] - a

        const f = this.invHashMask * amplitude

        sample.value += (a + b * t) * f
        sample.derivative.x += b * dt * frequency * f
    },

    value2D(point, frequency, amplitude, sample) {
        const x = point.x * frequency,
              y = point.y * frequency
        const ix = Math.floor(x) & this.hashMask
        const iy = Math.floor(y) & this.hashMask
        const tx = this.smooth(x - Math.floor(x)),
            ty = this.smooth(y - Math.floor(y))

        const hash = this.hash
        const h0 = hash[ix],
            h1 = hash[ix + 1],
            h00 = hash[h0 + iy],
            h10 = hash[h1 + iy],
            h01 = hash[h0 + iy + 1],
            h11 = hash[h1 + iy + 1]

        const a = h00,
            b = h10 - h00,
            c = h01 - h00,
            d = h11 - h01 - h10 + h00

        sample.value += ( a + b * tx + (c + d * tx) * ty) * this.invHashMask * amplitude
    },

    value2DwithDerivative(point, frequency, amplitude, sample) {
        const x = point.x * frequency,
              y = point.y * frequency
        const ix = Math.floor(x) & this.hashMask
        const iy = Math.floor(y) & this.hashMask
        let tx = x - Math.floor(x),
            ty = y - Math.floor(y)

        const hash = this.hash
        const h0 = hash[ix],
            h1 = hash[ix + 1],
            h00 = hash[h0 + iy],
            h10 = hash[h1 + iy],
            h01 = hash[h0 + iy + 1],
            h11 = hash[h1 + iy + 1]

        const dtx = this.smoothDerivative(tx),
              dty = this.smoothDerivative(ty)
        tx = this.smooth(tx)
        ty = this.smooth(ty)

        const a = h00,
            b = h10 - h00,
            c = h01 - h00,
            d = h11 - h01 - h10 + h00

        const f = this.invHashMask * amplitude

        sample.value += ( a + b * tx + (c + d * tx) * ty) * f
        sample.derivative.x += ((b + d * ty) * dtx) * frequency * f
        sample.derivative.y += ((c + d * tx) * dty) * frequency * f
    },

    value3D(point, frequency, amplitude, sample) {
        const x = point.x * frequency,
              y = point.y * frequency,
              z = point.z * frequency
        const ix = Math.floor(x) & this.hashMask
        const iy = Math.floor(y) & this.hashMask
        const iz = Math.floor(z) & this.hashMask
        const tx = this.smooth(x - Math.floor(x)),
            ty = this.smooth(y - Math.floor(y)),
            tz = this.smooth(z - Math.floor(z))

        const hash = this.hash
        const h0 = hash[ix],
            h1 = hash[ix + 1],
            h00 = hash[h0 + iy],
            h10 = hash[h1 + iy],
            h01 = hash[h0 + iy + 1],
            h11 = hash[h1 + iy + 1],
            h000 = hash[h00 + iz],
            h100 = hash[h10 + iz],
            h010 = hash[h01 + iz],
            h110 = hash[h11 + iz],
            h001 = hash[h00 + iz + 1],
            h101 = hash[h10 + iz + 1],
            h011 = hash[h01 + iz + 1],
            h111 = hash[h11 + iz + 1]

        const a = h000,
            b = h100 - h000,
            c = h010 - h000,
            d = h001 - h000,
            e = h110 - h010 - h100 + h000,
            f = h101 - h001 - h100 + h000,
            g = h011 - h001 - h010 + h000,
            h = h111 - h011 - h101 + h001 - h110 + h010 + h100 - h000

        const factor = this.invHashMask * amplitude
        sample.value += (a + b * tx + (c + e * tx) * ty + (d + f * tx + (g + h * tx) * ty) * tz) * factor
    },

    value3DwithDerivative(point, frequency, amplitude, sample) {
        const x = point.x * frequency,
              y = point.y * frequency,
              z = point.z * frequency
        const ix = Math.floor(x) & this.hashMask
        const iy = Math.floor(y) & this.hashMask
        const iz = Math.floor(z) & this.hashMask
        let tx = x - Math.floor(x),
            ty = y - Math.floor(y),
            tz = z - Math.floor(z)

        const hash = this.hash
        const h0 = hash[ix],
            h1 = hash[ix + 1],
            h00 = hash[h0 + iy],
            h10 = hash[h1 + iy],
            h01 = hash[h0 + iy + 1],
            h11 = hash[h1 + iy + 1],
            h000 = hash[h00 + iz],
            h100 = hash[h10 + iz],
            h010 = hash[h01 + iz],
            h110 = hash[h11 + iz],
            h001 = hash[h00 + iz + 1],
            h101 = hash[h10 + iz + 1],
            h011 = hash[h01 + iz + 1],
            h111 = hash[h11 + iz + 1]

        const dtx = this.smoothDerivative(tx),
            dty = this.smoothDerivative(ty),
            dtz = this.smoothDerivative(tz)
        tx = this.smooth(tx)
        ty = this.smooth(ty)
        tz = this.smooth(tz)

        const a = h000,
            b = h100 - h000,
            c = h010 - h000,
            d = h001 - h000,
            e = h110 - h010 - h100 + h000,
            f = h101 - h001 - h100 + h000,
            g = h011 - h001 - h010 + h000,
            h = h111 - h011 - h101 + h001 - h110 + h010 + h100 - h000

        const factor = this.invHashMask * amplitude
        sample.value += (a + b * tx + (c + e * tx) * ty + (d + f * tx + (g + h * tx) * ty) * tz) * factor
        sample.derivative.x += (b + e * ty + (f + h * ty) * tz) * dtx * frequency * factor
        sample.derivative.y += (c + e * tx + (g + h * tx) * tz) * dty * frequency * factor
        sample.derivative.z += (d + f * tx + (g + h * tx) * ty) * dtz * frequency * factor
    },

    perlin1D(point, frequency, amplitude, sample) {
        const x = point.x * frequency
        let i = Math.floor(x) & this.hashMask
        let t0 = x - Math.floor(x)

        const g0 = this.gradients1D[this.hash[i] & this.gradientsMask1D],
              g1 = this.gradients1D[this.hash[i + 1] & this.gradientsMask1D]

        const a = g0 * t0,
              b = g1 * (t0 - 1) - a

        const f = 2 * amplitude

        sample.value += (a + b * this.smooth(t0)) * f
    },

    perlin1DwithDerivative(point, frequency, amplitude, sample) {
        const x = point.x * frequency
        let i = Math.floor(x) & this.hashMask
        let t0 = x - Math.floor(x)

        const g0 = this.gradients1D[this.hash[i] & this.gradientsMask1D],
              g1 = this.gradients1D[this.hash[i + 1] & this.gradientsMask1D]

        const v0 = g0 * t0,
              v1 = g1 * (t0 - 1)

        const dt = this.smoothDerivative(t0)
        const t = this.smooth(t0)

        const a = v0,
              b = v1 - v0
        const da = g0,
              db = g1 - g0

        const f = 2 * amplitude

        sample.value += (a + b * t) * f
        sample.derivative.x += (da + db * t + b * dt) * frequency * f
    },

    perlin2D(point, frequency, amplitude, sample) {
        const x = point.x * frequency,
              y = point.y * frequency
        const ix = Math.floor(x) & this.hashMask
        const iy = Math.floor(y) & this.hashMask
        let tx0 = x - Math.floor(x),
            ty0 = y - Math.floor(y)

        const hash = this.hash
        const h0 = hash[ix],
            h1 = hash[ix + 1]
        const g00 = hash[h0 + iy] & this.gradientsMask2D,
            g10 = hash[h1 + iy] & this.gradientsMask2D,
            g01 = hash[h0 + iy + 1] & this.gradientsMask2D,
            g11 = hash[h1 + iy + 1] & this.gradientsMask2D
        
        const gx = this.gradients2Dx, gy = this.gradients2Dy
        const   v00 = gx[g00] *  tx0    + gy[g00] *  ty0,
                v10 = gx[g10] * (tx0-1) + gy[g10] *  ty0,
                v01 = gx[g01] *  tx0    + gy[g01] * (ty0-1),
                v11 = gx[g11] * (tx0-1) + gy[g11] * (ty0-1)
        
        const tx = this.smooth(tx0),
              ty = this.smooth(ty0)

        const a = v00,
            b = v10 - v00,
            c = v01 - v00,
            d = v11 - v01 - v10 + v00

        const f = amplitude * Math.SQRT2

        sample.value += (a + b * tx + (c + d * tx) * ty) * f
    },

    perlin2DwithDerivative(point, frequency, amplitude, sample) {
        const x = point.x * frequency,
              y = point.y * frequency
        const ix = Math.floor(x) & this.hashMask
        const iy = Math.floor(y) & this.hashMask
        const tx0 = x - Math.floor(x),
            ty0 = y - Math.floor(y)

        const hash = this.hash
        const h0 = hash[ix],
            h1 = hash[ix + 1]
        const g00 = hash[h0 + iy] & this.gradientsMask2D,
            g10 = hash[h1 + iy] & this.gradientsMask2D,
            g01 = hash[h0 + iy + 1] & this.gradientsMask2D,
            g11 = hash[h1 + iy + 1] & this.gradientsMask2D
        
        const gx = this.gradients2Dx, gy = this.gradients2Dy
        const   v00 = gx[g00] *  tx0    + gy[g00] *  ty0,
                v10 = gx[g10] * (tx0-1) + gy[g10] *  ty0,
                v01 = gx[g01] *  tx0    + gy[g01] * (ty0-1),
                v11 = gx[g11] * (tx0-1) + gy[g11] * (ty0-1)
        
        const dtx = this.smoothDerivative(tx0),
              dty = this.smoothDerivative(ty0)
        const tx = this.smooth(tx0),
              ty = this.smooth(ty0)

        const a = v00,
            b = v10 - v00,
            c = v01 - v00,
            d = v11 - v01 - v10 + v00

        const da = g00,
            db = g10 - g00,
            dc = g01 - g00,
            dd = g11 - g01 - g10 + g00

        const f = amplitude * Math.SQRT2

        sample.value += (a + b * tx + (c + d * tx) * ty) * f
        const derivative = da + db * tx + (dc + dd * tx) * ty
        sample.derivative.x += (derivative + (b + d * ty) * dtx) * frequency * f
        sample.derivative.y += (derivative + (c + d * tx) * dty) * frequency * f
    },

    perlin3D(point, frequency, amplitude, sample) {
        const x = point.x * frequency,
              y = point.y * frequency,
              z = point.z * frequency
        const ix = Math.floor(x) & this.hashMask
        const iy = Math.floor(y) & this.hashMask
        const iz = Math.floor(z) & this.hashMask
        let tx0 = x - Math.floor(x),
            ty0 = y - Math.floor(y),
            tz0 = z - Math.floor(z)

        const hash = this.hash
        const h0 = hash[ix],
            h1 = hash[ix + 1],
            h00 = hash[h0 + iy],
            h10 = hash[h1 + iy],
            h01 = hash[h0 + iy + 1],
            h11 = hash[h1 + iy + 1]
        const g000 = hash[h00 + iz] & this.gradientsMask3D,
              g100 = hash[h10 + iz] & this.gradientsMask3D,
              g010 = hash[h01 + iz] & this.gradientsMask3D,
              g110 = hash[h11 + iz] & this.gradientsMask3D,
              g001 = hash[h00 + iz + 1] & this.gradientsMask3D,
              g101 = hash[h10 + iz + 1] & this.gradientsMask3D,
              g011 = hash[h01 + iz + 1] & this.gradientsMask3D,
              g111 = hash[h11 + iz + 1] & this.gradientsMask3D

        const gx = this.gradients3Dx, gy = this.gradients3Dy, gz = this.gradients3Dz

        const   v000 = gx[g000] *  tx0    + gy[g000] *  ty0    + gz[g000] *  tz0,
                v100 = gx[g100] * (tx0-1) + gy[g100] *  ty0    + gz[g100] *  tz0,
                v010 = gx[g010] *  tx0    + gy[g010] * (ty0-1) + gz[g010] *  tz0,
                v110 = gx[g110] * (tx0-1) + gy[g110] * (ty0-1) + gz[g110] *  tz0,
                v001 = gx[g001] *  tx0    + gy[g001] *  ty0    + gz[g001] * (tz0-1),
                v101 = gx[g101] * (tx0-1) + gy[g101] *  ty0    + gz[g101] * (tz0-1),
                v011 = gx[g011] *  tx0    + gy[g011] * (ty0-1) + gz[g011] * (tz0-1),
                v111 = gx[g111] * (tx0-1) + gy[g111] * (ty0-1) + gz[g111] * (tz0-1)

        const tx = this.smooth(tx0),
              ty = this.smooth(ty0),
              tz = this.smooth(tz0)

        const a = v000,
              b = v100 - v000,
              c = v010 - v000,
              d = v001 - v000,
              e = v110 - v010 - v100 + v000,
              f = v101 - v001 - v100 + v000,
              g = v011 - v001 - v010 + v000,
              h = v111 - v011 - v101 + v001 - v110 + v010 + v100 - v000
        
        sample.value += (a + b * tx + (c + e * tx) * ty + (d + f * tx + (g + h * tx) * ty) * tz) * amplitude
    },

    perlin3DwithDerivative(point, frequency, amplitude, sample) {
        const x = point.x * frequency,
              y = point.y * frequency,
              z = point.z * frequency
        const ix = Math.floor(x) & this.hashMask
        const iy = Math.floor(y) & this.hashMask
        const iz = Math.floor(z) & this.hashMask
        let tx0 = x - Math.floor(x),
            ty0 = y - Math.floor(y),
            tz0 = z - Math.floor(z)

        const hash = this.hash
        const h0 = hash[ix],
            h1 = hash[ix + 1],
            h00 = hash[h0 + iy],
            h10 = hash[h1 + iy],
            h01 = hash[h0 + iy + 1],
            h11 = hash[h1 + iy + 1]
        const g000 = hash[h00 + iz] & this.gradientsMask3D,
              g100 = hash[h10 + iz] & this.gradientsMask3D,
              g010 = hash[h01 + iz] & this.gradientsMask3D,
              g110 = hash[h11 + iz] & this.gradientsMask3D,
              g001 = hash[h00 + iz + 1] & this.gradientsMask3D,
              g101 = hash[h10 + iz + 1] & this.gradientsMask3D,
              g011 = hash[h01 + iz + 1] & this.gradientsMask3D,
              g111 = hash[h11 + iz + 1] & this.gradientsMask3D

        const gx = this.gradients3Dx, gy = this.gradients3Dy, gz = this.gradients3Dz

        const   v000 = gx[g000] *  tx0    + gy[g000] *  ty0    + gz[g000] *  tz0,
                v100 = gx[g100] * (tx0-1) + gy[g100] *  ty0    + gz[g100] *  tz0,
                v010 = gx[g010] *  tx0    + gy[g010] * (ty0-1) + gz[g010] *  tz0,
                v110 = gx[g110] * (tx0-1) + gy[g110] * (ty0-1) + gz[g110] *  tz0,
                v001 = gx[g001] *  tx0    + gy[g001] *  ty0    + gz[g001] * (tz0-1),
                v101 = gx[g101] * (tx0-1) + gy[g101] *  ty0    + gz[g101] * (tz0-1),
                v011 = gx[g011] *  tx0    + gy[g011] * (ty0-1) + gz[g011] * (tz0-1),
                v111 = gx[g111] * (tx0-1) + gy[g111] * (ty0-1) + gz[g111] * (tz0-1)

        const dtx = this.smoothDerivative(tx0),
            dty = this.smoothDerivative(ty0),
            dtz = this.smoothDerivative(tz0)
        const tx = this.smooth(tx0),
              ty = this.smooth(ty0),
              tz = this.smooth(tz0)

        const a = v000,
              b = v100 - v000,
              c = v010 - v000,
              d = v001 - v000,
              e = v110 - v010 - v100 + v000,
              f = v101 - v001 - v100 + v000,
              g = v011 - v001 - v010 + v000,
              h = v111 - v011 - v101 + v001 - v110 + v010 + v100 - v000
      
        const da = g000,
            db = g100 - g000,
            dc = g010 - g000,
            dd = g001 - g000,
            de = g110 - g010 - g100 + g000,
            df = g101 - g001 - g100 + g000,
            dg = g011 - g001 - g010 + g000,
            dh = g111 - g011 - g101 + g001 - g110 + g010 + g100 - g000
        
        const derivative = da + db * tx + (dc + de * tx) * ty + (dd + df * tx + (dg + dh * tx) * ty) * tz
        sample.value += (a + b * tx + (c + e * tx) * ty + (d + f * tx + (g + h * tx) * ty) * tz) * amplitude
        const factor = frequency * amplitude
        sample.derivative.x += (derivative + (b + e * ty + (f + h * ty) * tz) * dtx) * factor
        sample.derivative.y += (derivative + (c + e * tx + (g + h * tx) * tz) * dty) * factor
        sample.derivative.z += (derivative + (d + f * tx + (g + h * tx) * ty) * dtz) * factor
    }
}
