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
        }
    }

})
