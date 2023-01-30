const Portal = () => ({
    isPortal: true,

    clipping() {
        this.upper.u0 = this.upper.offU + this.segment.p0.l * this.upper.lengthU
        this.upper.u1 = this.upper.offU + this.segment.p1.l * this.upper.lengthU
        this.lower.u0 = this.lower.offU + this.segment.p0.l * this.lower.lengthU
        this.lower.u1 = this.lower.offU + this.segment.p1.l * this.lower.lengthU

        this.viewport = null
    },

    loadViewport() {
        this.viewport = ViewportsPool.take()
        this.viewport.sector = this.next
        this.viewport.segment = this.segment
        this.viewport.project()
    },
    
    draw(viewport) {
        const bottomZ = this.segment.bottomZ
        const topZ    = this.segment.topZ
        this.hasStepUp = this.next.floor.z >= bottomZ && Camera.pos.z > this.next.floor.z

        // Step UP
        if (this.next.floor.z > bottomZ) {
            this.segment.toScreenSpace(this.next.floor.z, bottomZ)
            this.drawPlane(this.lower, viewport)
        }

        // Step DOWN
        if (this.next.ceiling.z < topZ) {
            this.segment.toScreenSpace(topZ, this.next.ceiling.z)
            this.drawPlane(this.upper, viewport, 0, 1)
        }

        this.segment.toScreenSpace(
            Math.min(this.next.ceiling.z, topZ),
            Math.max(this.next.floor.z, bottomZ)
        )

        if (!this.viewport) this.loadViewport()

        this.viewport.top = this.next.ceiling.z >= viewport.sector.ceiling.z && Camera.pos.z > topZ
            ? viewport.top
            : Math.max(viewport.top,    ~~this.segment.getTopAt(viewport.x))
        this.viewport.bottom = this.next.floor.z <= viewport.sector.floor.z && Camera.pos.z < bottomZ
            ? viewport.bottom
            : Math.min(viewport.bottom, ~~this.segment.getBottomAt(viewport.x))
        this.viewport.x = viewport.x
        this.segment.toScreenSpace(topZ, bottomZ)
        
        this.viewport.draw()
    },

    drawPlane(texture, viewport, topFactor = 1, bottomFactor = 0) {
        const s = this.segment

        const dx = (viewport.x - s.p0.col) / (s.p1.col - s.p0.col)
        
        // Cálculo U
        const depth  = s.p0.depth  + (s.p1.depth  - s.p0.depth)  * dx
        const uinv = texture.u0 * s.p0.depth + (texture.u1 * s.p1.depth - texture.u0 * s.p0.depth) * dx
        const i0 = ((uinv / depth) & (texture.w - 1)) * texture.h

        // Cálculo V
        const top    = s.p0.top    + (s.p1.top    - s.p0.top)    * dx
        const bottom = s.p0.bottom + (s.p1.bottom - s.p0.bottom) * dx
        const dv = s.height * /*texture.h*/32 / ((bottom - top) * texture.scaleV)

        const b = Math.min(bottom, viewport.bottom) * 4
        let y = Math.max(~~top, viewport.top)

        if (b < 0 || y > Renderer.height) return

        let v = texture.offV + (y - top * topFactor - bottom * bottomFactor) * dv

        const l = Math.max(0, Math.min(s.sector.light + depth, 1))
        for (y *= 4; y < b; y+=4, v+=dv) {
            const i = (i0 + (v % texture.h)) << 2

            Renderer.column[y]   = texture.data[i]   * l
            Renderer.column[y+1] = texture.data[i+1] * l
            Renderer.column[y+2] = texture.data[i+2] * l
        }
    }
})
