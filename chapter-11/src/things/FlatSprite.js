const FlatSprite = () => ({
    isFlat: true,
    pos: v3(),
    h: 1, w: 1,
    angle: 0,

    init() {
        [this.p0, this.p1, this.p2, this.p3] = new Array(4).fill(0).map(Point)
        this.updateShape()
    },
    
    // Se debe llamar cuando alteramos el ángulo, las dimensiones del Thing o la posición
    updateShape() {
        const cosh2 = Math.cos(this.angle) * this.h * .5, sinh2 = Math.sin(this.angle) * this.h * .5,
              cosw2 = Math.cos(this.angle) * this.w * .5, sinw2 = Math.sin(this.angle) * this.w * .5
        const sx = this.pos.x, sy = this.pos.y
        this.p0.x = sx + cosw2 - sinh2; this.p0.y = sy + sinw2 + cosh2;
        this.p1.x = sx + cosw2 + sinh2; this.p1.y = sy + sinw2 - cosh2;
        this.p2.x = sx - cosw2 - sinh2; this.p2.y = sy - sinw2 + cosh2;
        this.p3.x = sx - cosw2 + sinh2; this.p3.y = sy - sinw2 - cosh2;
    },

    project() {
        if (this.pos.z > Camera.pos.z && !this.ceiling ||
            this.pos.z <= Camera.pos.z && !this.floor) return false
        const {p0, p1, p2, p3} = this
        p0.toCameraSpace(); p1.toCameraSpace(); p2.toCameraSpace(); p3.toCameraSpace();
        if (p0.yp > Camera.nearPlane && p1.yp > Camera.nearPlane &&
            p2.yp > Camera.nearPlane && p3.yp > Camera.nearPlane) return false

        p0.yp = Math.min(Camera.nearPlane, p0.yp); p0.toDepthSpace()
        p1.yp = Math.min(Camera.nearPlane, p1.yp); p1.toDepthSpace()
        p2.yp = Math.min(Camera.nearPlane, p2.yp); p2.toDepthSpace()
        p3.yp = Math.min(Camera.nearPlane, p3.yp); p3.toDepthSpace()

        const x0 = Math.max(0,                Math.min(p0.col, p1.col, p2.col, p3.col)),
              x1 = Math.min(Renderer.width-1, Math.max(p0.col, p1.col, p2.col, p3.col))

        if (x0 >= Renderer.width || x1 < 0) return false

        let dmin = p0, dmax = p0;
        if (p1.depth > dmax.depth) dmax = p1; if (p1.depth < dmin.depth) dmin = p1;
        if (p2.depth > dmax.depth) dmax = p2; if (p2.depth < dmin.depth) dmin = p2;
        if (p3.depth > dmax.depth) dmax = p3; if (p3.depth < dmin.depth) dmin = p3;
        dmin.toScreenSpace(this.pos.z, this.pos.z); dmax.toScreenSpace(this.pos.z, this.pos.z);

        const y0 = Math.max(0,                   Math.min(dmin.top, dmax.top)),
              y1 = Math.min(Renderer.height - 1, Math.max(dmin.top, dmax.top))

        if (y0 >= Renderer.height || y1 < 0) return false

        this.y0 = ~~y0; this.y1 = ~~y1; this.x0 = x0; this.x1 = x1;
        this.dmin = dmin.depth; this.dmax = dmax.depth;
        return true
    },

    drawBefore(thing) {
        if (thing.isFlat) {
            if (this.dmax < thing.dmin) return true
            if (this.dmin > thing.dmax) return false
        } else {
            if (this.x0 > thing.segment.p1.col || this.x1 < thing.segment.p0.col) return true
            const depth = thing.segment.getDepthAt((this.x0 + this.x1) * .5)
            if (this.dmax < depth) return true
            if (this.dmin > depth) return false
        }
        return Math.abs(this.pos.z - Camera.pos.z) > Math.abs(thing.pos.z - Camera.pos.z)
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
    }
})
