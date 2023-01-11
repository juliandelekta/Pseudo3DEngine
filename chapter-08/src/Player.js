const Player = {
    pos: v3(0,0,0),
    last: v3(0,0,0),

    moveSpeed: 4.5,
    strafeSpeed: 4.5,
    crouchSpeed: 1.5,

    update(deltaTime) {
        const keys = Controls.inkey
        const moveVelocity = deltaTime * this.moveSpeed   * (keys.KeyW - keys.KeyS),
            strafeVelocity = deltaTime * this.strafeSpeed * (keys.KeyD - keys.KeyA),
            crouchVelocity = deltaTime * this.crouchSpeed * (keys.Space - keys.KeyC);

        this.last.x = Camera.pos.x
        this.last.y = Camera.pos.y
        this.last.z = Camera.pos.z

        this.pos.x += Camera.dir.x * moveVelocity - Camera.dir.y * strafeVelocity
        this.pos.y += Camera.dir.y * moveVelocity + Camera.dir.x * strafeVelocity
        this.pos.z += crouchVelocity

        Camera.pos.x += (this.pos.x - Camera.pos.x) * deltaTime * 10
        Camera.pos.y += (this.pos.y - Camera.pos.y) * deltaTime * 10
        Camera.pos.z += (this.pos.z - Camera.pos.z) * deltaTime * 10
        Camera.center += (Controls.theta - Camera.center) * deltaTime * 15
        Camera.setAngle(Camera.angle + (Controls.phi - Camera.angle) * deltaTime * 15)

        this.checkCrossPortal()
    },

    checkCrossPortal() {
        const nextSector = this.getCrossedInSector(this.sector)
        if (this.sector.ceiling.interface && nextSector.ceiling.interface !== this.sector.ceiling.interface)
            this.sector.ceiling.interface.reset()
        if (this.sector.floor.interface && nextSector.floor.interface !== this.sector.floor.interface)
            this.sector.floor.interface.reset()
		this.sector = Renderer.MainViewport.sector = nextSector

        if (this.sector.ceiling.next) {
			if (Camera.pos.z > this.sector.ceiling.z) {
				// Como desde un único Flat se pueden ir a varios Sector dependiendo el movimiento,
				// tengo que garantizar que puedo volver por el lugar donde vine, por eso es necesaria
				// la siguiente línea
				this.sector.ceiling.next.floor.next = this.sector // Garantizo la ida y la vuelta
				this.sector = Renderer.MainViewport.sector = this.sector.ceiling.next
			} else {
                const upSector = this.getCrossedInSector(this.sector.ceiling.next)
                if (upSector !== this.sector.ceiling.next)
                    this.sector.ceiling.interface.updateUpSector(upSector)
			}
        }

        if (this.sector.floor.next) {
			if (Camera.pos.z < this.sector.floor.z) {
				this.sector.floor.next.ceiling.next = this.sector
				this.sector = Renderer.MainViewport.sector = this.sector.floor.next
			} else {
                const downSector = this.getCrossedInSector(this.sector.floor.next)
                if (downSector !== this.sector.floor.next)
                    this.sector.floor.interface.updateDownSector(downSector)
			}
        }
    },
	
	getCrossedInSector(sector) {
		for (const s of sector.segments) {
            if (s.isVectorCrossing(this.last.x, this.last.y, Camera.pos.x, Camera.pos.y)) {
                if (s.wall.isPortal) {
					return s.wall.next
                } else if (s.wall.isStack) {
                    for (const subwall of s.wall.walls) {
                        if ((sector.floor.z + subwall.z || Infinity) > Camera.pos.z && subwall.isPortal) {
							return subwall.next
                        }
                    }
                }
            }
        }
		return sector
	}
}
