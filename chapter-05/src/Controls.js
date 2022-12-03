const Controls = {
    // Teclas presionadas
    inkey: {
        KeyW:0, KeyS:0,
        KeyA:0, KeyD:0,
    },

    // El init anexiona los Eventos relacionados con la pulsación de teclas
    init() {
        document.addEventListener("keydown", e => {this.inkey[e.code] = true})
        document.addEventListener("keyup",   e => {this.inkey[e.code] = false})
    },

    // Update actualiza el movimiento y la dirección de la Camera
    update (deltaTime) {
        const moveSpeed = deltaTime * 4.5 * (this.inkey.KeyW - this.inkey.KeyS),
          rotationSpeed = deltaTime * 1.5 * (this.inkey.KeyD - this.inkey.KeyA);
        Camera.pos.x += Camera.dir.x * moveSpeed
        Camera.pos.y += Camera.dir.y * moveSpeed
        Camera.setAngle(Camera.angle + rotationSpeed)
    }
}
