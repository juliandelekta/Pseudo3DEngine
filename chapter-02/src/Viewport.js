const Viewport = () => ({
    // Buffers con información de cada columna
    closest: new Array(Screen.width),
    depth:   new Array(Screen.width).fill(0),

    loadBuffers() {
        // Limpia el depth buffer
        this.depth.fill(0)

        for (const s of this.sector.visibles) {

            const from = Math.max(0, Math.min(Screen.width - 1, s.p0.col))
            const to   = Math.max(0, Math.min(Screen.width - 1, s.p1.col))

            for (let c = from; c <= to; c++) {
                const d = s.getDepthAt(c)
                if (d > this.depth[c]) {
                    this.closest[c] = s
                    this.depth[c] = d
                }
            }
        }
    },

})
