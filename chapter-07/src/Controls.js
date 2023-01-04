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

    // element: pointerLockElement
    init(element) {
        document.addEventListener("keydown", e => {this.inkey[e.code] = true})
        document.addEventListener("keyup",   e => {this.inkey[e.code] = false})

        const mmove = e => {
            xpos.innerHTML = "X:" + ~~((e.clientX - element.offsetLeft) * Renderer.width / element.offsetWidth)
            ypos.innerHTML = "Y:" + ~~((e.clientY - element.offsetTop) * Renderer.height / element.offsetHeight)
        };

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
        element.onmousemove = mmove
        document.addEventListener("pointerlockchange", () => {
            if (document.pointerLockElement === element) {
				element.addEventListener("mousemove", onMouseMove, false)
            } else {
				element.removeEventListener("mousemove", onMouseMove, false)
                element.onclick = enterPointerLock
                element.onmousemove = mmove
            }
        }, false)
    }
}
