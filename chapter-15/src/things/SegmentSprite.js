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
        if (thing.isFlat || thing.isVoxel || thing.isEmitter) {
            if (thing.x0 > this.segment.p1.col || thing.x1 < this.segment.p0.col) return true
            const depth = this.segment.getDepthAt((thing.x0 + thing.x1) * .5)
            if (thing.dmax < depth) return false
            if (thing.dmin > depth) return true
            return Math.abs(this.pos.z - Camera.pos.z) > Math.abs(thing.pos.z - Camera.pos.z)
        } else {
            const s0 = this.segment.p0.col, s1 = this.segment.p1.col,
                t0 = thing.segment.p0.col, t1 = thing.segment.p1.col
            if (s0 > t1 || t0 > s1) return true // No hay superposición
            const col = Math.max(0, s0, t0)
            return thing.segment.getDepthAt(col) > this.segment.getDepthAt(col)
        }
    },

    distanceSqrTo(obj) {
        const dx = obj.x - this.pos.x,
            dy = obj.y - this.pos.y,
            dz = obj.z - this.pos.z
        return dx * dx + dy * dy + dz * dz
    },

    draw(u, top, bottom, viewport) {
        const texture = this.texture
        const dv = texture.h / (bottom - top)

        let clippingBottom = viewport.bottom
        if (viewport.segment && ~~viewport.segment.getBottomAt(viewport.x) === viewport.bottom) {
            // El Portal impone el bottom
            if (viewport.segment.wall.hasStepUp)
                clippingBottom = Renderer.height
        }
        const b = Math.min(bottom, clippingBottom) * 4

        let y = Math.max(~~(top + texture.first[u] / dv) + 1, viewport.top)

        if (b < 0 || y > Renderer.height || y << 2 > b) return

        let v = (y - top) * dv
        const i0 = u * texture.h


        let light = Bakery.lights[0],
            d = this.distanceSqrTo(light)
        for (let i = 1; i < Bakery.lights.length; i++) {
            const d0 = this.distanceSqrTo(Bakery.lights[i])
            if (d0 < d) {
                d = d0
                light = Bakery.lights[i]
            }
        }
        const l = 1//1 / ((.28 * d + 0.89) * light.falloff + 1)

        for (y *= 4; y < b; y+=4, v+=dv) {
            const i = (i0 + (v & (texture.h - 1))) << 2
            const alpha = texture.data[i + 3] / 255,
                  beta = 1 - alpha

            Renderer.column[y]   = beta * Renderer.column[y]   + alpha * texture.data[i] * l
            Renderer.column[y+1] = beta * Renderer.column[y+1] + alpha * texture.data[i+1] * l
            Renderer.column[y+2] = beta * Renderer.column[y+2] + alpha * texture.data[i+2] * l
            Renderer.column[y+3] = beta * Renderer.column[y+3] + alpha * texture.data[i+3]
        }
    }
}
