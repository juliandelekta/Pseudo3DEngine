const Viewport = (width) => ({
    // Buffers con información de cada columna
    closest: new Array(width),
    depth:   new Array(width).fill(0),

    clear() {
        this.top = 0
        this.bottom = Renderer.height
        this.depth.fill(0)
    },

    loadBuffers() {
        for (const s of this.sector.visibles) {

            let from = Math.max(~~(s.p0.col + 1), 0),
                to   = Math.min(~~s.p1.col, width - 1)

            const dd = (s.p1.depth - s.p0.depth) / (s.p1.col - s.p0.col)
            let d = (from - s.p0.col) * dd + s.p0.depth
            for (let c = from; c <= to; c++, d+=dd) {
                if (d > this.depth[c]) {
                    this.closest[c] = s
                    this.depth[c] = d
                }
            }
        }
    },

    project() {
        this.clear()
        this.sector.project()
        this.loadBuffers()
    },

    draw() {
        const segment = this.closest[this.x]
        if (segment) {
            this.drawLine(0, Math.max(segment.getTopAt(this.x), this.top), 50, 50, 50)
            this.drawLine(Math.min(segment.getBottomAt(this.x), this.bottom), Renderer.height, 123, 123, 123)
            segment.wall.draw(this)
        }
    },
    
    drawLine(from, to, r, g, b) {
        for (from <<= 2, to <<= 2; from < to; from+=4) {
            Renderer.column[from] = r
            Renderer.column[from+1] = g
            Renderer.column[from+2] = b
        }
    }
})
