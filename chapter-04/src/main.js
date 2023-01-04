// Iniciamos la Camera
Camera.setAngle(0)
Camera.setFOV(Math.PI / 3)

// Iniciamos el Canvas
Renderer.init(document.getElementById("canvas"))

// Iniciamos los Controles
Controls.init()

// Iniciamos los Loaders
TextureLoader.init()
TextureLoader.onReady = () => {
    // Cargamos el nivel
    if(ResourceManager.setLevel("first_level"))
        update(0)
}

window.onload = () => TextureLoader.makeTextures()

// Controlamos el Range para el FOV
const range = document.getElementById("FOVRange")
range.addEventListener("input", () => {
    Camera.setFOV(range.value * Math.PI / 180)
    document.getElementById("FOVValue").innerText = range.value + "°"
})

const FPS = {
    values: [60, 60, 60, 60],
    i: 0,
    element: document.getElementById("fps"),

    update(val) {
        this.values[this.i] = val
        this.i = (this.i + 1) & 3
        this.element.innerText = ( (
            this.values[0] +
            this.values[1] +
            this.values[2] +
            this.values[3]
        ) * .25 ).toFixed(2) + "FPS"
    }
}

let lastTime = 0

// Main Loop
function update(time) {
    const deltaTime = (time - lastTime) * 0.001
    lastTime = time
    FPS.update(1 / deltaTime)

    Controls.update(deltaTime)

    Renderer.draw()

    requestAnimationFrame(update)
}