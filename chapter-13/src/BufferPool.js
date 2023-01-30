const BufferPool = {
    length: 0,

    init() {
        this.buffers = new Array(32).fill(0).map(_ => ({
            side: {
                y: new Float32Array(Renderer.width),
                z: new Float64Array(Renderer.width),
                u: new Float64Array(Renderer.width)
            },
            upper: {
                y: new Float32Array(Renderer.width),
                zinv: new Float64Array(Renderer.width),
                uinv: new Float64Array(Renderer.width),
                vinv: new Float64Array(Renderer.width)
            },

            lower: {
                y: new Float32Array(Renderer.width),
                zinv: new Float64Array(Renderer.width),
                uinv: new Float64Array(Renderer.width),
                vinv: new Float64Array(Renderer.width)
            },

            segment: Segment(0,0,0,0)
        }))
    },
    
    take() {
        return this.buffers[this.length++]
    },

    clear() {
        this.length = 0
    }
}
