const Point = (x, y) => ({
    x, y, // World Coordinates

    toCameraSpace() {
        const xd = this.x - Camera.pos.x,
			  yd = this.y - Camera.pos.y;
		this.xp = (-xd * Camera.dir.y + yd * Camera.dir.x) * Camera.FOVRelation
		this.yp =  -xd * Camera.dir.x - yd * Camera.dir.y
    },

    toDepthSpace() {
        this.depth = - 1 / this.yp
        this.col = Renderer.width * .5 * (1 + this.xp * this.depth)
    },

    toScreenSpace(topZ, bottomZ) {
        this.top    = Camera.center - (topZ    - Camera.pos.z) * Camera.dp * this.depth
        this.bottom = Camera.center - (bottomZ - Camera.pos.z) * Camera.dp * this.depth
    }
})

const Segment = (x0, y0, x1, y1) => ({
    p0: Point(x0, y0), // Initial Point
    p1: Point(x1, y1), // End Point
    length: Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)),

    toCameraSpace() {
        this.p0.toCameraSpace()
        this.p1.toCameraSpace()
    },

    toDepthSpace(byPass = false) {
        this.toCameraSpace()
		const xp0 = this.p0.xp, yp0 = this.p0.yp,
			  xp1 = this.p1.xp, yp1 = this.p1.yp;

        this.p0.l = 0
        this.p1.l = 1

		/* Near Plane Culling */
		if (yp0 > Camera.nearPlane) {
			if (yp1 > Camera.nearPlane) return false // El segment está detrás del Near Plane
			const dy = (Camera.nearPlane - yp0) / (yp1 - yp0)
			this.p0.xp += (xp1 - xp0) * dy
            this.p0.l = dy
			this.p0.yp = Camera.nearPlane
		} else if (yp1 > Camera.nearPlane) {
			const dy = (Camera.nearPlane - yp1) / (yp0 - yp1)
			this.p1.xp += (xp0 - xp1) * dy
            this.p1.l = 1 - dy
			this.p1.yp = Camera.nearPlane
		}

		this.p0.toDepthSpace()
        this.p1.toDepthSpace()

        // Verifica si el segment proyectado está dentro de los límites de la pantalla y el mismo esté orientado hacia la cámara
        return (this.p0.col < Renderer.width) &&
               (this.p1.col >= 0) &&
               (this.p0.col < this.p1.col) || byPass
	},

    toScreenSpace(topZ, bottomZ) {
        this.p0.toScreenSpace(topZ, bottomZ)
        this.p1.toScreenSpace(topZ, bottomZ)
        this.height = topZ - bottomZ
        this.topZ = topZ
        this.bottomZ = bottomZ
    },

    isVectorCrossing(ax, ay, bx, by) {
        const abx = bx - ax,                aby = by - ay
		const ajx = this.p1.x - ax,         ajy = this.p1.y - ay
		const ijx = this.p1.x - this.p0.x,  ijy = this.p1.y - this.p0.y
		const ibx = bx - this.p0.x,         iby = by - this.p0.y
		const iax = ax - this.p0.x,         iay = ay - this.p0.y
        return  (aby * iax < abx * iay) &&
                (ajx * aby < ajy * abx) &&
                (ijx * iby < ijy * ibx) &&
                (iax * ijy < iay * ijx)
    },

    // Llena el arreglo depth con la interpolación lineal de depth entre p0 y p1
    // En los extremos col0 y col1 se ponen los valores depth0 y depth1 respectivamente
    // En los valores intermedios se hace la interpolación
    fillDepth(depth) {
        const dd = (this.p1.depth - this.p0.depth) / (this.p1.col - this.p0.col)
        let from = Math.max(0, ~~(this.p0.col + 1)),
            to   = Math.min(Renderer.width-1, ~~this.p1.col)

        let d = (from - this.p0.col) * dd + this.p0.depth
        for (let c = from; c <= to; c++, d+=dd)
            depth[c] = d
    },

    fillTop(top) {
        const dt = (this.p1.top - this.p0.top) / (this.p1.col - this.p0.col)
        let from = Math.max(0, ~~(this.p0.col + 1)),
            to   = Math.min(Renderer.width-1, ~~this.p1.col)

        let t = (from - this.p0.col) * dt + this.p0.top
        for (let c = from; c <= to; c++, t+=dt)
            top[c] = t
    },

    fillBottom(bottom) {
        const db = (this.p1.bottom - this.p0.bottom) / (this.p1.col - this.p0.col)
        let from = Math.max(0, ~~(this.p0.col + 1)),
            to   = Math.min(Renderer.width-1, ~~this.p1.col)

        let b = (from - this.p0.col) * db + this.p0.bottom
        for (let c = from; c <= to; c++, b+=db)
            bottom[c] = b
    },

    getDepthAt(col) {
        return (this.p1.depth - this.p0.depth) * (col - this.p0.col) / (this.p1.col - this.p0.col) + this.p0.depth
    },

    getTopAt(col) {
        return (this.p1.top - this.p0.top) * (col - this.p0.col) / (this.p1.col - this.p0.col) + this.p0.top
    },

    getBottomAt(col) {
        return (this.p1.bottom - this.p0.bottom) * (col - this.p0.col) / (this.p1.col - this.p0.col) + this.p0.bottom
    }
})
