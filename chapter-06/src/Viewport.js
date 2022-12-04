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

            const from = Math.max(0, Math.min(width - 1, s.p0.col))
            const to   = Math.max(0, Math.min(width - 1, s.p1.col))

            for (let c = from; c <= to; c++) {
                const d = s.getDepthAt(c)
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
            this.sector.ceiling.draw(segment.getTopAt(this.x), this)
            this.sector.floor.draw(segment.getBottomAt(this.x), this)
            segment.wall.draw(this)
        }
    }
})
