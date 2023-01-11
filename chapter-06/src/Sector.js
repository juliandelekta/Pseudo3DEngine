const Sector = (name) => ({
    name,
    segments: [],
    visibles: [],

    project() {
        this.visibles.length = 0 // Limpio el arreglo auxiliar
        for (const s of this.segments)
            if (s.toDepthSpace()) {
                this.visibles[this.visibles.length] = s
                s.toScreenSpace(this.ceiling.z, this.floor.z)
                s.wall.clipping()
            }
    }

})
