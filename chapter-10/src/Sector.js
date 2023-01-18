const Sector = (name) => ({
    name,
    segments: [],
    visibles: [],
    things: [],
    visibleThings: [],

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
    }
})
