const Sector = (name) => ({
    name,
    segments: [],
    visibles: [],
    things: [],
    visibleThings: [],
    subsectors: [],

    project() {
        if (this.renderId === Renderer.renderId) return
        this.renderId = Renderer.renderId
        
        this.visibles.length = 0 // Limpio el arreglo auxiliar
        for (const s of this.segments) {
            if (s.toDepthSpace()) {
                this.visibles[this.visibles.length] = s
                s.toScreenSpace(this.ceiling.z, this.floor.z)
                s.wall.clipping()
            }

            if (s.wall.isPortal) {
                s.wall.viewport = null
            } else if (s.wall.isStack) {
                for (const subwall of s.wall.walls)
                    if (subwall.isPortal)
                        subwall.viewport = null
            }
        }
        
        if (this.floor.next)   this.floor.viewport   = null
        if (this.ceiling.next) this.ceiling.viewport = null

        if (this.slopeFloor) this.slopeFloor.project()
        if (this.slopeCeil)  this.slopeCeil.project()

        this.visibleThings.length = 0 // Limpio el arreglo auxiliar
        if (this.things.length) {
            for (const thing of this.things)
                if(thing.project())
                    this.visibleThings[this.visibleThings.length] = thing

            this.sortThings()
        }
    },

    sortThings() {
        const A = this.visibleThings
        for (let i = 1; i < A.length; i++) {
            let j = i
            while (j > 0 && A[j].drawBefore(A[j-1])) {
                // Swap
                const temp = A[j]
                A[j] = A[j-1]
                A[j-1] = temp
                j--
            }
        }
    },

    // Devuelve true si las coordenadas están dentro del sector
	// Algoritmo de ray tracing, se cuenta cuántos segments cruzo con un rayo horizontal
	// si es impar: estoy dentro del sector, si es par: estoy afuera
	inside(x, y) {
		let cross = 0;
		for (const s of this.border) {
			const x0 = Math.min(s.p0.x, s.p1.x);
			const x1 = Math.max(s.p0.x, s.p1.x);
			const y0 = Math.min(s.p0.y, s.p1.y);
			const y1 = Math.max(s.p0.y, s.p1.y);
			if (y <= y0 || y > y1 || x > x1) continue;
			if (x0 > x) {cross++; continue}
			const xi = s.p0.x + (y - s.p0.y) * (s.p1.x - s.p0.x) / (s.p1.y - s.p0.y);
			cross += x < xi;
		}
		return cross % 2;
	},

	addSubsector(sector) {
		this.subsectors.push(sector)
	},
})