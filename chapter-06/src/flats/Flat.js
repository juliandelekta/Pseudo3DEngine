const Flat = {
    drawFlat(viewport) {
        const texture = this.texture
        const w = texture.w / texture.scaleU
		const h = texture.h / texture.scaleV

        const u0 = this.isRelative ? viewport.sector.reference.x : 0
        const v0 = this.isRelative ? viewport.sector.reference.y : 0
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
    }
}
