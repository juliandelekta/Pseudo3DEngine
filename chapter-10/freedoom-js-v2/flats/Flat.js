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
            lookup = Camera.lookup, off = - Camera.center + Renderer.height * .5,
            tw = texture.w - 1, th = texture.h - 1
        

        for (let y = this.y0, y1 = this.y1; y < y1; y++) {
		    const rowDistance = distanceRelation * lookup[~~(y + off)]/// (y - Camera.center)
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
		const h = texture.h / texture.scaleV

        const angle = Camera.angle + (viewport.x/Renderer.width - 0.5) * Camera.FOV
        const u = (angle * w) & (texture.w - 1)

        for (let y = this.y0; y < this.y1; y++) {
            const v = h - (Camera.center - y) * .5

            const Y = y << 2
            const i = (u * texture.h + (v & (texture.h - 1))) << 2

            Renderer.column[Y]   = texture.data[i];
            Renderer.column[Y+1] = texture.data[i+1];
            Renderer.column[Y+2] = texture.data[i+2];
        }
    }
}