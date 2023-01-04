const Point = (x, y) => ({
    x, y, // World Coordinates

    toCameraSpace() {
        const xd = this.x - Camera.pos.x,
			  yd = this.y - Camera.pos.y;
		this.xp = (-xd * Camera.dir.y + yd * Camera.dir.x) * Camera.FOVRelation
		this.yp =  -xd * Camera.dir.x - yd * Camera.dir.y
    },

    toDepthSpace() {
        this.col = Renderer.width * .5 * (1 - this.xp / this.yp)
        this.depth = - 1 / this.yp
    },

    toScreenSpace(topZ, bottomZ) {
        this.top    = Renderer.height * .5 - (topZ    - Camera.pos.z) * Camera.dp * this.depth
        this.bottom = Renderer.height * .5 - (bottomZ - Camera.pos.z) * Camera.dp * this.depth
    }
})

const Segment = (x0, y0, x1, y1) => ({
    p0: Point(x0, y0), // Initial Point
    p1: Point(x1, y1), // End Point

    color: `hsl(${~~(Math.random() * 360) % 360}, 80%, 50%)`,

    toCameraSpace() {
        this.p0.toCameraSpace()
        this.p1.toCameraSpace()
    },

    toDepthSpace() {
        this.toCameraSpace()
		const xp0 = this.p0.xp, yp0 = this.p0.yp,
			  xp1 = this.p1.xp, yp1 = this.p1.yp;

		/* Near Plane Culling */
		if (yp0 > Camera.nearPlane) {
			if (yp1 > Camera.nearPlane) return false // El segment está detrás del Near Plane
			const dy = (Camera.nearPlane - yp0) / (yp1 - yp0)
			this.p0.xp += (xp1 - xp0) * dy
			this.p0.yp = Camera.nearPlane
		} else if (yp1 > Camera.nearPlane) {
			const dy = (Camera.nearPlane - yp1) / (yp0 - yp1)
			this.p1.xp += (xp0 - xp1) * dy
			this.p1.yp = Camera.nearPlane
		}

		this.p0.toDepthSpace()
        this.p1.toDepthSpace()

        // Verifica si el segment proyectado está dentro de los límites de la pantalla y el mismo esté orientado hacia la cámara
        return (this.p0.col < Renderer.width) &&
               (this.p1.col >= 0) &&
               (this.p0.col < this.p1.col)
	},

    toScreenSpace(topZ, bottomZ) {
        this.p0.toScreenSpace(topZ, bottomZ)
        this.p1.toScreenSpace(topZ, bottomZ)
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
