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
        const col = Renderer.column

        for (let y = this.y0; y < this.y1; y++) {
		    const rowDistance = distanceRelation / (y - Camera.center)
            const l = Math.max(0, Math.min(this.sector.light + 1 / rowDistance, 1))

            const u = (offU + rowDistance * dirX) & (texture.w - 1),
                  v = (offV + rowDistance * dirY) & (texture.h - 1);

            const Y = y << 2
            const i = (u * texture.h + v) << 2
            const r = texture.data[i] * l, g = texture.data[i+1] * l, b = texture.data[i+2] * l

            col[Y]   = r
            col[Y+1] = g
            col[Y+2] = b
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
