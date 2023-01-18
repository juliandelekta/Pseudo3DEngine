const SegmentSprite = {
    clipping() {
        this.u0 = this.segment.p0.l * this.texture.w
        this.u1 = this.segment.p1.l * this.texture.w
    },

    project() {
        if (!this.segment.toDepthSpace(true)) return false
        this.segment.toScreenSpace(this.pos.z + this.h * .5, this.pos.z - this.h * .5)
        this.clipping()
        return true
    },

    drawBefore(thing) {
        const s0 = this.segment.p0.col, s1 = this.segment.p1.col,
            t0 = thing.segment.p0.col, t1 = thing.segment.p1.col
        if (s0 > t1 || t0 > s1) return true // No hay superposición
        const col = Math.max(0, s0, t0)
        return thing.segment.getDepthAt(col) > this.segment.getDepthAt(col)
    },

    draw(u, top, bottom, viewport) {
        const texture = this.texture
        const dv = texture.h / (bottom - top)

        let vpBottom = viewport.bottom
        if (globalX === viewport.x) {
            globalX = -1
        }
        if (viewport.segment && ~~viewport.segment.getBottomAt(viewport.x) === viewport.bottom) {
            // El Portal impone el bottom
            if (viewport.segment.wall.hasStepUp)
                vpBottom = Renderer.height
        }
        const b = Math.min(bottom, vpBottom) * 4
        let y = Math.max(~~(top + texture.first[u] / dv), viewport.top)

        if (b < 0 || y > Renderer.height || y << 2 > b) return

        let v = (y - top) * dv
        const i0 = u * texture.h
        const col = Renderer.column, data = texture.data
        for (y *= 4; y < b; y+=4, v+=dv) {
            const i = (i0 + (v & (texture.h - 1))) << 2
            const alpha = texture.data[i + 3] / 255,
                  beta = 1 - alpha

            col[y]   = beta * col[y]   + alpha * data[i]
            col[y+1] = beta * col[y+1] + alpha * data[i+1]
            col[y+2] = beta * col[y+2] + alpha * data[i+2]
            col[y+3] = beta * col[y+3] + alpha * data[i+3]
        }
    }
}
var globalX = -1