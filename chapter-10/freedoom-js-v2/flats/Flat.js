const Flat = {
    drawFlat(viewport) {
        const texture = this.texture
        const w = 32 / texture.scaleU
		const h = 32 / texture.scaleV

        const u0 = this.isRelative ? this.sector.reference.x : 0
        const v0 = this.isRelative ? this.sector.reference.y : 0
        const distanceRelation = (Camera.pos.z - this.z) * Camera.dp

		const offU = texture.offU + (Camera.pos.x - u0) * w,
			  offV = texture.offV + (Camera.pos.y - v0) * h;

        const dirX = (Camera.left.x + Camera.delta.x * viewport.x) * w,
              dirY = (Camera.left.y + Camera.delta.y * viewport.x) * h;
        const col = Renderer.column, data = texture.data,
            tw = texture.w - 1, th = texture.h - 1
        

        for (let y = this.y0, y1 = this.y1; y < y1; y++) {
		    const rowDistance = distanceRelation / (y - Camera.center)
            const l = Math.max(0, Math.min(this.sector.light + 1 / rowDistance, 1))

            const u = (offU + rowDistance * dirX) & tw,
                  v = (offV + rowDistance * dirY) & th;

            const Y = y << 2
            const i = (u * texture.h + v) << 2

            col[Y]   = data[i] * l
            col[Y+1] = data[i+1] * l
            col[Y+2] = data[i+2] * l
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
    }
}
