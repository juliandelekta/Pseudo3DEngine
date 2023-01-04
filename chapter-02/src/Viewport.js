const Viewport = (width) => ({
    // Buffers con información de cada columna
    closest: new Array(width),
    depth:   new Array(width).fill(0),

    loadBuffers() {
        // Limpia el depth buffer
        this.depth.fill(0)

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
        this.sector.project()
        this.loadBuffers()
    },
    
    draw(ctx) {
        const segment = this.closest[this.x]
        if (segment) {
            ctx.strokeStyle = segment.color
            ctx.beginPath()
                ctx.moveTo(this.x, ~~(segment.getTopAt(this.x)))
                ctx.lineTo(this.x, ~~(segment.getBottomAt(this.x)))
            ctx.stroke()
        }
    }

})
