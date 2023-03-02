const Wall = () => ({
    clipping() {
        this.texture.u0 = this.texture.offU + this.segment.p0.l * this.texture.lengthU
        this.texture.u1 = this.texture.offU + this.segment.p1.l * this.texture.lengthU

        this.lightmap.u0 = .5 + this.segment.p0.l * (this.lightmap.w-2)
        this.lightmap.u1 = .5 + this.segment.p1.l * (this.lightmap.w-2)
    },

    drawDiffuse(viewport) {
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
        const dv = s.height * texture.h / ((bottom - top) * texture.scaleV)

        const b = Math.min(bottom, viewport.bottom) * 4
        let y = Math.max(~~top, viewport.top)

        if (b < 0 || y > Renderer.height) return

        let v = texture.offV + (y - top) * dv

        for (y *= 4; y < b; y+=4, v+=dv) {
            const i = (i0 + (v & (texture.h - 1))) << 2

            Renderer.column[y]   = texture.data[i]
            Renderer.column[y+1] = texture.data[i+1]
            Renderer.column[y+2] = texture.data[i+2]
        }
    },

    drawLightmap(viewport) {
        const s = this.segment,
            lightmap = this.lightmap;

        const dx = (viewport.x - s.p0.col) / (s.p1.col - s.p0.col)
        
        // Cálculo U
        const depth  = s.p0.depth  + (s.p1.depth  - s.p0.depth)  * dx
        const uinv = lightmap.u0 * s.p0.depth + (lightmap.u1 * s.p1.depth - lightmap.u0 * s.p0.depth) * dx
        const u = uinv / depth
        const i0 = (~~u) * lightmap.h

        // Cálculo V
        const top    = s.p0.top    + (s.p1.top    - s.p0.top)    * dx
        const bottom = s.p0.bottom + (s.p1.bottom - s.p0.bottom) * dx
        const dv = (lightmap.h-2) / (bottom - top)

        const b = Math.min(bottom, viewport.bottom) * 4
        let y = Math.max(~~top, viewport.top)

        if (b < 0 || y > Renderer.height) return

        let v = (y - top) * dv + .5

        for (y *= 4; y < b; y+=4, v+=dv) {
            const gv = ~~v
            const Q11 = lightmap.data[i0 + gv],
                Q12 = lightmap.data[i0 + gv + 1],
                Q21 = lightmap.data[i0 + lightmap.h + gv],
                Q22 = lightmap.data[i0 + lightmap.h + gv + 1]
                
            Renderer.column[y]   =
            Renderer.column[y+1] =
            Renderer.column[y+2] = Q11 + (u - ~~u) * (Q21 - Q11) + (v - gv) * (Q12 - Q11 + (u - ~~u) * (Q22 - Q12 - Q21 + Q11))
        }
    },

    draw(viewport) {
        const s = this.segment,
            lightmap = this.lightmap,
            texture = this.texture

        const dx = (viewport.x - s.p0.col) / (s.p1.col - s.p0.col)
        
        // Cálculo U
        const depth  = s.p0.depth  + (s.p1.depth  - s.p0.depth)  * dx
        const uinv = texture.u0 * s.p0.depth + (texture.u1 * s.p1.depth - texture.u0 * s.p0.depth) * dx
        const i0 = ((uinv / depth) & (texture.w - 1)) * texture.h
        const ulinv = lightmap.u0 * s.p0.depth + (lightmap.u1 * s.p1.depth - lightmap.u0 * s.p0.depth) * dx
        const ul = ulinv / depth
        const i0l = (~~ul) * lightmap.h

        // Cálculo V
        const top    = s.p0.top    + (s.p1.top    - s.p0.top)    * dx
        const bottom = s.p0.bottom + (s.p1.bottom - s.p0.bottom) * dx
        const dv = s.height * texture.h / ((bottom - top) * texture.scaleV)
        const dvl = (lightmap.h-2) / (bottom - top)

        const b = Math.min(bottom, viewport.bottom) * 4
        let y = Math.max(~~top, viewport.top)

        if (b < 0 || y > Renderer.height) return

        let v = texture.offV + (y - top) * dv,
            vl = (y - top) * dvl + .5

        for (y *= 4; y < b; y+=4, v+=dv, vl+=dvl) {
            const i = (i0 + (v & (texture.h - 1))) << 2
            const gv = ~~vl
            const Q11 = lightmap.data[i0l + gv],
                Q12 = lightmap.data[i0l + gv + 1],
                Q21 = lightmap.data[i0l + lightmap.h + gv],
                Q22 = lightmap.data[i0l + lightmap.h + gv + 1]

            const l = Math.min((Q11 + (ul - ~~ul) * (Q21 - Q11) + (vl - gv) * (Q12 - Q11 + (ul - ~~ul) * (Q22 - Q12 - Q21 + Q11))) * .00392 + this.segment.sector.light, 1)

            Renderer.column[y]   = texture.data[i] * l
            Renderer.column[y+1] = texture.data[i+1] * l
            Renderer.column[y+2] = texture.data[i+2] * l
        }
    }

})
