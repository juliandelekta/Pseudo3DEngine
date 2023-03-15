const Flat = {
    drawFlat(viewport) {
        const texture = this.texture
        const w = texture.w / texture.scaleU
		const h = texture.h / texture.scaleV

        const u0 = this.isRelative ? this.sector.reference.x : 0
        const v0 = this.isRelative ? this.sector.reference.y : 0
        const distanceRelation = (Camera.pos.z - this.z) * Camera.dp

		const offU = texture.offU + (Camera.pos.x - u0) * w,
			  offV = texture.offV + (Camera.pos.y - v0) * h;

        const dirX = (Camera.left.x + Camera.delta.x * viewport.x) * w,
              dirY = (Camera.left.y + Camera.delta.y * viewport.x) * h;

        for (let y = this.y0; y < this.y1; y++) {
		    const rowDistance = distanceRelation / (y - Camera.center)

            const u = (offU + rowDistance * dirX) & (texture.w - 1),
                  v = (offV + rowDistance * dirY) & (texture.h - 1);

            const Y = y << 2
            const i = (u * texture.h + v) << 2

            Renderer.column[Y]   = texture.data[i]
            Renderer.column[Y+1] = texture.data[i+1]
            Renderer.column[Y+2] = texture.data[i+2]
        }
    },

    drawParallax(viewport) {
        const texture = this.texture
        const w = texture.w / (texture.scaleU * 2 * Math.PI)

        const angle = Camera.angle + Camera.parallaxU[viewport.x]
        const i0 = ((angle * w) & (texture.w - 1)) * texture.h

        const top = Camera.center - texture.scaleV * Camera.parallaxV[viewport.x]
        let y = Math.max(~~top, viewport.top)
        const b = Math.min(Camera.center, viewport.bottom) << 2
        const dv = texture.h / (Camera.center - top)

        let v = (y - top) * dv

        for (y <<= 2; y < b; y+=4, v+=dv) {
            const i = (i0 + (v & (texture.h - 1))) << 2

            Renderer.column[y]   = texture.data[i]
            Renderer.column[y+1] = texture.data[i+1]
            Renderer.column[y+2] = texture.data[i+2]
        }
    },


    loadViewport() {
        this.viewport = ViewportsPool.take()
        this.viewport.sector = this.next
		this.viewport.segment = null
        this.viewport.project()
    },

    drawNext(viewport) {
        if (!this.viewport) this.loadViewport()

        this.viewport.top    = Math.max(viewport.top,    this.y0)
        this.viewport.bottom = Math.min(viewport.bottom, this.y1)
        this.viewport.x = viewport.x
        
        this.viewport.draw()
    },

    drawLightmap(viewport) {
        const lightmap = this.lightmap,
            s = lightmap.size

        const u0 = lightmap.origin.u
        const v0 = lightmap.origin.v
        const distanceRelation = (Camera.pos.z - this.z) * Camera.dp

		const offU = (Camera.pos.x - u0) * s + 0.5,
			  offV = (Camera.pos.y - v0) * s + 0.5;

        const dirX = (Camera.left.x + Camera.delta.x * viewport.x) * s,
              dirY = (Camera.left.y + Camera.delta.y * viewport.x) * s;

        for (let y = this.y0; y < this.y1; y++) {
		    const rowDistance = distanceRelation / (y - Camera.center)

            const u = offU + rowDistance * dirX
                  v = offV + rowDistance * dirY

            const i0 = (~~u) * lightmap.h

            const Y = y << 2

            const gv = ~~v
            const Q11 = lightmap.data[i0 + gv],
                Q12 = lightmap.data[i0 + gv + 1],
                Q21 = lightmap.data[i0 + lightmap.h + gv],
                Q22 = lightmap.data[i0 + lightmap.h + gv + 1]
            Renderer.column[Y]   =
            Renderer.column[Y+1] =
            Renderer.column[Y+2] = Q11 + (u - ~~u) * (Q21 - Q11) + (v - gv) * (Q12 - Q11 + (u - ~~u) * (Q22 - Q12 - Q21 + Q11))
        }
    },

    drawFlatWithLight(viewport) {
        const lightmap = this.lightmap,
            s = lightmap.size

        const distanceRelation = (Camera.pos.z - this.z) * Camera.dp

		const offUl = (Camera.pos.x - lightmap.origin.u) * s + 0.5,
			  offVl = (Camera.pos.y - lightmap.origin.v) * s + 0.5

        const texture = this.texture
        const w = texture.w / texture.scaleU
		const h = texture.h / texture.scaleV

        const u0 = this.isRelative ? this.sector.reference.x : 0
        const v0 = this.isRelative ? this.sector.reference.y : 0

		const offU = texture.offU + (Camera.pos.x - u0) * w,
			  offV = texture.offV + (Camera.pos.y - v0) * h;

        const camDirX = Camera.left.x + Camera.delta.x * viewport.x,
              camDirY = Camera.left.y + Camera.delta.y * viewport.x

        const dirX = camDirX * w,
              dirY = camDirY * h;

        const dirXl = camDirX * s,
              dirYl = camDirY * s;

        for (let y = this.y0; y < this.y1; y++) {
		    const rowDistance = distanceRelation / (y - Camera.center)

            const ul = offUl + rowDistance * dirXl
                  vl = offVl + rowDistance * dirYl

            const i0 = (~~ul) * lightmap.h

            const u = (offU + rowDistance * dirX) & (texture.w - 1),
                  v = (offV + rowDistance * dirY) & (texture.h - 1);

            const i = (u * texture.h + v) << 2

            const Y = y << 2

            const gv = ~~vl
            const Q11 = lightmap.data[i0 + gv],
                Q12 = lightmap.data[i0 + gv + 1],
                Q21 = lightmap.data[i0 + lightmap.h + gv],
                Q22 = lightmap.data[i0 + lightmap.h + gv + 1]
            const l = Math.min((Q11 + (ul - ~~ul) * (Q21 - Q11) + (vl - gv) * (Q12 - Q11 + (ul - ~~ul) * (Q22 - Q12 - Q21 + Q11))) * 0.00391 + this.sector.light, 1)

            Renderer.column[Y]   = texture.data[i] * l
            Renderer.column[Y+1] = texture.data[i+1] * l
            Renderer.column[Y+2] = texture.data[i+2] * l
        }
    }
}
