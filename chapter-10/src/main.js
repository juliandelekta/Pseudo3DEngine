// Iniciamos la Camera
Camera.setAngle(0)
Camera.setFOV(Math.PI / 3)

// Iniciamos el Canvas
Renderer.init(document.getElementById("canvas"))

ViewportsPool.init()
BufferPool.init()

// Iniciamos los Controles
Controls.init(document.getElementById("canvas"))

// Iniciamos los Loaders
TextureLoader.init()
TextureLoader.onReady = () => {
    // Cargamos el nivel
    if (ResourceManager.setLevel("first_level")) {
        update(0)
        var t = 0; setInterval(() => {
            ResourceManager.levels.first_level.sectors.internal.floor.z = 0.4 + 0.5 * Math.sin(t)
            ResourceManager.levels.first_level.sectors.internal.ceiling.z = 1.6 + 0.5 * Math.sin(t+=0.03)
        }, 30)
    }
}

window.onload = () => TextureLoader.makeTextures()

// Controlamos el Range para el FOV
const range = document.getElementById("FOVRange")
range.addEventListener("input", () => {
    Camera.setFOV(range.value * Math.PI / 180)
    document.getElementById("FOVValue").innerText = range.value + "°"
})

const xpos = document.getElementById("x")
const ypos = document.getElementById("y")


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

    Player.update(deltaTime)

    Renderer.draw()

    requestAnimationFrame(update)
}

