const Player = {
    pos: v3(0,0,0),

    moveSpeed: 4.5,
    strafeSpeed: 4.5,
    crouchSpeed: 1.5,

    update(deltaTime) {
        const keys = Controls.inkey
        const moveVelocity = deltaTime * this.moveSpeed   * (keys.KeyW - keys.KeyS),
            strafeVelocity = deltaTime * this.strafeSpeed * (keys.KeyD - keys.KeyA),
            crouchVelocity = deltaTime * this.crouchSpeed * (keys.Space - keys.KeyC);

        this.pos.x += Camera.dir.x * moveVelocity - Camera.dir.y * strafeVelocity
        this.pos.y += Camera.dir.y * moveVelocity + Camera.dir.x * strafeVelocity
        this.pos.z += crouchVelocity

        Camera.pos.x += (this.pos.x - Camera.pos.x) * deltaTime * 10
        Camera.pos.y += (this.pos.y - Camera.pos.y) * deltaTime * 10
        Camera.pos.z += (this.pos.z - Camera.pos.z) * deltaTime * 10
        Camera.center += (Controls.theta - Camera.center) * deltaTime * 15
        Camera.setAngle(Camera.angle + (Controls.phi - Camera.angle) * deltaTime * 15)
    }
}
