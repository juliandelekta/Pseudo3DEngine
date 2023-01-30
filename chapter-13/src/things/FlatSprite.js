const FlatSprite = () => ({
    isFlat: true,
    pos: v3(),
    h: 1, w: 1,
    angle: 0,

    init() {
        this.initRectangle()
    },

    project() {
        if (this.pos.z > Camera.pos.z && !this.ceiling ||
            this.pos.z <= Camera.pos.z && !this.floor) return false
        if (!this.projectPoints()) return false
        if (this.y0 >= Renderer.height || this.y1 < 0) return false
		return true
    },

    draw(viewport) {
        if (this.x1 < viewport.x || this.x0 > viewport.x) return
        const texture = this.texture
        const w = texture.w / this.w
		const h = texture.h / this.h
        const w_2 = texture.w * .5, h_2 = texture.h * .5
        const cos = Math.cos(this.angle), sin = Math.sin(this.angle)

        const distanceRelation = (Camera.pos.z - this.pos.z) * Camera.dp

        const offU = Camera.pos.x - this.pos.x,
              offV = Camera.pos.y - this.pos.y

        const dirX = Camera.left.x + Camera.delta.x * viewport.x,
              dirY = Camera.left.y + Camera.delta.y * viewport.x

        const column = Renderer.column, data = texture.data, depth = 1/viewport.depth[viewport.x]
        for (let y = Math.max(viewport.top, this.y0), b = Math.min(viewport.bottom, this.y1); y <= b; y++) {
		    const rowDistance = distanceRelation / (y - Camera.center)
            if (rowDistance > depth) continue

            const u0 = offU + dirX * rowDistance,
                  v0 = offV + dirY * rowDistance
            const u = w_2 + (cos * u0 + sin * v0) * w,
                  v = h_2 + (cos * v0 - sin * u0) * h

            if (u < 0 || u > texture.w || v < 0 || v > texture.h) continue

            const Y = y << 2
            const i = (~~u * texture.h + ~~v) << 2

            const alpha = data[i + 3] / 255,
                  beta = 1 - alpha

            column[Y]   = beta * column[Y]   + alpha * data[i]
            column[Y+1] = beta * column[Y+1] + alpha * data[i+1]
            column[Y+2] = beta * column[Y+2] + alpha * data[i+2]
            column[Y+3] = beta * column[Y+3] + alpha * data[i+3]
        }
    },

    __proto__: Rectangle
})
