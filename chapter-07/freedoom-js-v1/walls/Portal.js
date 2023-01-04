const Portal = () => ({
    isPortal: true,

    culling() {
        this.up.u0 = this.up.offU + this.segment.p0.l * this.up.lengthU
        this.up.u1 = this.up.offU + this.segment.p1.l * this.up.lengthU
        this.down.u0 = this.down.offU + this.segment.p0.l * this.down.lengthU
        this.down.u1 = this.down.offU + this.segment.p1.l * this.down.lengthU
    },

    loadViewport() {
        this.viewport = ViewportsPool.take()
        this.viewport.sector = this.next
        this.viewport.segment = this.segment
        this.viewport.project()
    },
    
    draw(viewport) {
        this.culling()
        let bottomZ = viewport.sector.floor.z
        let topZ    = viewport.sector.ceiling.z

        // Step UP
        if (this.next.floor.z > bottomZ) {
            this.segment.toScreenSpace(this.next.floor.z, bottomZ)
            this.drawPlane(this.down, this.next.floor.z - bottomZ, viewport)
            bottomZ = this.next.floor.z
        }

        // Step DOWN
        if (this.next.ceiling.z < topZ) {
            this.segment.toScreenSpace(topZ, this.next.ceiling.z)
            this.drawPlane(this.up, topZ - this.next.ceiling.z, viewport, true)
            topZ = this.next.ceiling.z
        }

        this.segment.toScreenSpace(topZ, bottomZ)

        if (!this.viewport) this.loadViewport()
        this.viewport.top    = Math.max(viewport.top,    ~~this.segment.getTopAt(viewport.x))
        this.viewport.bottom = Math.min(viewport.bottom, ~~this.segment.getBottomAt(viewport.x))
        this.viewport.x = viewport.x
        Renderer.vps[Renderer.vps.length] = this.viewport
    },

    drawPlane(texture, height, viewport, up = 0) {
        const s = this.segment

        const dx = (viewport.x - s.p0.col) / (s.p1.col - s.p0.col)
        
        // Cálculo U
        const depth  = s.p0.depth  + (s.p1.depth  - s.p0.depth)  * dx
        const uinv = texture.u0 * s.p0.depth + (texture.u1 * s.p1.depth - texture.u0 * s.p0.depth) * dx
        const i0 = ((uinv / depth) & (texture.w - 1)) * texture.h

        // Cálculo V
        const top    = s.p0.top    + (s.p1.top    - s.p0.top)    * dx
        const bottom = s.p0.bottom + (s.p1.bottom - s.p0.bottom) * dx
        const dv = height * 32 / ((bottom - top) * texture.scaleV)

        if (top > Renderer.height || bottom < 0) return;
        if (viewport.top < 0) throw viewport

        const b = Math.min(bottom, viewport.bottom) * 4
        let y = Math.max(~~top, viewport.top)

        let v = texture.offV + (y - top) * dv - (bottom - top) * dv * up

        const l = Math.max(0, Math.min(s.sector.light + depth, 1))
        for (y *= 4; y < b; y+=4, v+=dv) {
            // const i = (i0 + (v & (texture.h - 1))) << 2
            const i = (i0 + (v % texture.h)) << 2

            Renderer.column[y]   = texture.data[i]   * l
            Renderer.column[y+1] = texture.data[i+1] * l
            Renderer.column[y+2] = texture.data[i+2] * l
        }
    }
})
