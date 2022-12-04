const Controls = {
    // Teclas presionadas
    inkey: {
        KeyW:0, KeyS:0,
        KeyA:0, KeyD:0,
        Space: 0, KeyC: 0
    },

    phi: 0,
    phiSpeed: 0.5,
    theta: 0,
    thetaSpeed: 100,

    pos: v3(0,0,0),

    // element: pointerLockElement
    init(element) {
        document.addEventListener("keydown", e => {this.inkey[e.code] = true})
        document.addEventListener("keyup",   e => {this.inkey[e.code] = false})

        this.theta = Camera.center
        this.phi = Camera.angle
        const upperLimit = Renderer.height * .5 - 100
        const lowerLimit = Renderer.height * .5 + 100
        const onMouseMove = e => {
            this.theta -= this.thetaSpeed * e.movementY / Renderer.height
            this.theta = Math.max(upperLimit, Math.min(lowerLimit, this.theta)) // Clamp
            this.phi += this.phiSpeed * e.movementX / Renderer.width
        }

        const enterPointerLock = () => (document.pointerLockElement !== element) && element.requestPointerLock()

        element.onclick = enterPointerLock
        document.addEventListener("pointerlockchange", () => {
            if (document.pointerLockElement === element) {
				element.addEventListener("mousemove", onMouseMove, false)
            } else {
				element.removeEventListener("mousemove", onMouseMove, false)
                element.onclick = enterPointerLock
            }
        }, false)
    },

    update (deltaTime) {
        const moveSpeed = deltaTime * 4.5 * (this.inkey.KeyW - this.inkey.KeyS),
            strafeSpeed = deltaTime * 4.5 * (this.inkey.KeyD - this.inkey.KeyA),
            crouchSpeed = deltaTime * 1.5 * (this.inkey.Space - this.inkey.KeyC);

        this.pos.x += Camera.dir.x * moveSpeed - Camera.dir.y * strafeSpeed
        this.pos.y += Camera.dir.y * moveSpeed + Camera.dir.x * strafeSpeed
        this.pos.z += crouchSpeed

        Camera.pos.x += (this.pos.x - Camera.pos.x) * deltaTime * 10
        Camera.pos.y += (this.pos.y - Camera.pos.y) * deltaTime * 10
        Camera.pos.z += (this.pos.z - Camera.pos.z) * deltaTime * 10
        Camera.center += (this.theta - Camera.center) * deltaTime * 15
        Camera.setAngle(Camera.angle + (this.phi - Camera.angle) * deltaTime * 15)
    }
}
