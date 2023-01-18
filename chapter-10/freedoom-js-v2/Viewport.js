const Viewport = (width) => ({
    // Buffers con información de cada columna
    closest: new Array(width),
    depth:   new Array(width).fill(0),
    boundary: new Array(width).fill(Infinity),
    buckets: new Array(Renderer.width / 16).fill(0).map(() => []),

    clear() {
        this.top = 0
        this.bottom = Renderer.height
        this.depth.fill(0)
		this.closest.fill(null)
        for (const bucket of this.buckets)
            bucket.length = 0
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
		
        for (const t of this.sector.visibleThings) {
            if (this.segment && t.segment.p0.depth > Math.max(this.segment.p0.depth, this.segment.p1.depth)) continue
            let from = Math.max(t.segment.p0.col >> 4, 0) // floor(col / 16)
            const to = Math.min(t.segment.p1.col >> 4, this.buckets.length - 1)
            for (; from <= to; from++)
                this.buckets[from].push(t)
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
			if (segment.sector !== this.sector) throw "Different: " + this.x
			
            segment.sector.ceiling.draw(segment.getTopAt(this.x), this)
            segment.sector.floor.draw(segment.getBottomAt(this.x), this)
            segment.wall.draw(this)
        }

        const bucket = this.buckets[this.x >> 4]
        for (const thing of bucket)
            thing.draw(this)
    }
})
