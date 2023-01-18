const Player = {
    pos: v3(0,0,0),
    last: v3(0,0,0),

    moveSpeed: 10,
    strafeSpeed: 10,
    crouchSpeed: 3,

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
        let nextSector = this.getCrossedInSector(this.sector)
        if (nextSector !== this.sector) {
            const second = this.getCrossedInSector(nextSector) // Previene errores al cruzar por las esquinas de un subsector
            if (second !== this.sector) {
                this.sector = Renderer.MainViewport.sector = nextSector
            }
        }
    },
    getCrossedInSector(sector) {
		for (const s of sector.segments) {
            if (s.isVectorCrossing(this.last.x, this.last.y, Camera.pos.x, Camera.pos.y)) {
                if (s.wall.isPortal)
					return s.wall.next
            }
        }
		return sector
	}
}
