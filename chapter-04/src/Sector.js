const Sector = (name) => ({
    name,
    segments: [],
    visibles: [],

    floor:   {z: 0},
    ceiling: {z: 4},

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
