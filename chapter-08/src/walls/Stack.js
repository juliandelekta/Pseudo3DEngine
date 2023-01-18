const Stack = () => ({
    isStack: true,
    walls: [],

    clipping() {
        for (const wall of this.walls)
            wall.clipping()
    },

    loadViewport(visible) {
        for (const subwall of this.walls)
            if (subwall.isPortal)
                subwall.loadViewport(visible)
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
    }
})
