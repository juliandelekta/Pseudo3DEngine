const Wall = () => ({
    clipping() {
        this.texture.u0 = this.texture.offU + this.segment.p0.l * this.texture.lengthU
        this.texture.u1 = this.texture.offU + this.segment.p1.l * this.texture.lengthU
    },

    draw(viewport) {
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
        const dv = s.height * 32 / ((bottom - top) * texture.scaleV)

        const b = Math.min(bottom, viewport.bottom) * 4
        let y = Math.max(~~top, viewport.top)
        if (b < 0 || y > Renderer.height) return

        let v = texture.offV + (y - top) * dv - (bottom - top) * dv

        const l = Math.max(0, Math.min(s.sector.light + depth, 1))
        const col = Renderer.column, data = texture.data
        for (y *= 4; y < b; y+=4, v+=dv) {
            const i = (i0 + (v & (texture.h - 1))) << 2

            col[y]   = data[i] * l
            col[y+1] = data[i+1] * l
            col[y+2] = data[i+2] * l
        }
    },

})
