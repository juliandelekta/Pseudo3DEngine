const Viewport = (width) => ({
    // Buffers con información de cada columna
    closest:  new Array(width),
    depth:    new Array(width).fill(0),
    boundary: new Array(width).fill(Infinity),

    clear() {
        this.depth.fill(0)
        this.closest.fill(null)
    },

    loadBuffers() {
        for (const s of this.sector.visibles) {

            let from = Math.max(~~(s.p0.col + 1), 0),
                to   = Math.min(~~s.p1.col, width - 1)

            const dd = (s.p1.depth - s.p0.depth) / (s.p1.col - s.p0.col)
            let d = (from - s.p0.col) * dd + s.p0.depth
            for (let c = from; c <= to; c++, d+=dd) {
                if (d < this.boundary[c]) {
                    if (d > this.depth[c]) {
                        this.closest[c] = s
                        this.depth[c] = d
                    }
                }
            }
        }
    },

    project() {
        this.segment && this.segment.fillDepth(this.boundary)
        this.clear()
        this.sector.project()
        this.loadBuffers()
    },

    draw() {
        const segment = this.closest[this.x]
        if (segment) {
            segment.sector.ceiling.draw(segment.getTopAt(this.x), this)
            segment.sector.floor.draw(segment.getBottomAt(this.x), this)
            segment.wall.draw(this)
        }
    }
})
