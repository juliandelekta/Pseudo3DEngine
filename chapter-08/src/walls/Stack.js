const Stack = () => ({
    isStack: true,
    walls: [],

    clipping() {
        for (const wall of this.walls)
            wall.clipping()
    },

    draw(viewport) {
        let z = 0
        const floor = viewport.sector.floor.z
        const ceil = viewport.sector.ceiling.z
		for (const wall of this.walls) {
            wall.segment.toScreenSpace(floor + wall.z || ceil, floor + z)
			wall.draw(viewport)

			z = wall.z
		}
        this.segment.toScreenSpace(ceil, floor)
    },
	
	extendUp(viewport) {
        this.walls[this.walls.length - 1].extendUp(viewport)
	},
	
	extendDown(viewport) {
        this.walls[0].extendDown(viewport)
	}
})
