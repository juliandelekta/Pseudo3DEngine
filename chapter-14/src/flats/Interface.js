const Interface = (upSector, downSector) => ({
	up: [],
	down: [],
	
	upSector,
	downSector,
	
	addUp(flat) {
		this.up.push(flat)
	},
	
	addDown(flat) {
		this.down.push(flat)
	},
	
	updateUpSector(sector) {
		for (const f of this.down)
			f.next = sector
	},
	
	updateDownSector(sector) {
		for (const f of this.up)
			f.next = sector
	},

	reset() {
		this.updateUpSector(upSector)
		this.updateDownSector(downSector)
	}
})
