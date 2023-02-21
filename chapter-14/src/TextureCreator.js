// https://catlikecoding.com/unity/tutorials/noise/

var g, c
function CreateTexture(resolution) {
    const texture = {
        w: resolution,
        h: resolution,
        data: new Uint8ClampedArray(resolution * resolution * 4).fill(255),
        first: new Uint8Array(resolution).fill(0)
    }

    const stepSize = 1 / resolution
    const point = v3(0,0,0)
    /*g = Gradient(
        [ 0, color(0,0,255)],
        [0.4, color(255,255,255)],
        [0.5, color(0,0,0)],
        [0.6, color(255,255,0)],
        [  1, color(255,0,0)]
    )*/
    g = Gradient(
        [ 0, color(0,0,0)],
        [0.35, color(255,0,0)],
        [0.65, color(255,255,0)],
        [1, color(255,255,255)]
    )
    const options = {
        frequency: 3,
        octaves: 3,
        lacunarity: 2,    // Cambio en la frecuencia por cada octava
        persistence: 0.5, // Cambio en la amplitud por cada octava
        method: Noise.perlin2D,
        withDerivative: true,
        color: g 
    }
    c = color(0,0,0)
    const noise = Noise.createNoise(options)
    const sample = Noise.createSample()
    for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
            const i = x * resolution + y << 2
            point.x = (x * stepSize) - .5
            point.y = (y * stepSize) - .5
            noise(point, sample)
            options.color(sample.value, c)
            //options.color(x * stepSize, c)
            texture.data[i    ] = c.r
            texture.data[i + 1] = c.g
            texture.data[i + 2] = c.b
        }
    }

    return texture
}
