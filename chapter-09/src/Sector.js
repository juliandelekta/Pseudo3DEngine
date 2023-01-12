const Sector = (name) => ({
    name,
    segments: [],
    visibles: [],

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
    }
})
