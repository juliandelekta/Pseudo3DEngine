const Wall = () => ({
    culling() {
        this.texture.u0 = this.texture.offU + this.segment.p0.l * this.texture.lengthU
        this.texture.u1 = this.texture.offU + this.segment.p1.l * this.texture.lengthU
    },

    draw(viewport) {
        this.culling()

        const s = this.segment,
            texture = this.texture;

        const dx = (viewport.x - s.p0.col) / (s.p1.col - s.p0.col)
        
        // Cálculo U
        const depth  = s.p0.depth  + (s.p1.depth  - s.p0.depth)  * dx
        const uinv = texture.u0 * s.p0.depth + (texture.u1 * s.p1.depth - texture.u0 * s.p0.depth) * dx
        const i0 = ((uinv / depth) & (texture.w - 1)) * texture.h

        // Cálculo V
        const top    = s.p0.top    + (s.p1.top    - s.p0.top)    * dx
        const bottom = s.p0.bottom + (s.p1.bottom - s.p0.bottom) * dx
        const dv = (viewport.sector.ceiling.z - viewport.sector.floor.z) * texture.h / ((bottom - top) * texture.scaleV)

        const b = Math.min(bottom, viewport.bottom) << 2
        let y = Math.max(~~top, viewport.top)

        let v = texture.offV + (y - top) * dv

        for (y <<= 2; y < b; y+=4, v+=dv) {
            const i = (i0 + (v & (texture.h - 1))) << 2

            Renderer.column[y]   = texture.data[i]
            Renderer.column[y+1] = texture.data[i+1]
            Renderer.column[y+2] = texture.data[i+2]
        }
    },

})
